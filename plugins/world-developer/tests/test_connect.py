import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch, MagicMock

spec = importlib.util.spec_from_file_location('connect', Path(__file__).parents[1] / 'scripts/connect.py')
connect = importlib.util.module_from_spec(spec)
spec.loader.exec_module(connect)


class CredentialSetupTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix='world-connect-test-')
        self.home = Path(self.directory.name)
        self.key = 'api_fixture_key'

    def tearDown(self):
        self.directory.cleanup()

    def invoke(self, argv=None, response=None, tty=True):
        opener = MagicMock()
        opener.open.return_value.__enter__.return_value.read.return_value = json.dumps(response or {'result': {'content': []}}).encode()
        output = io.StringIO()
        with patch.object(connect.Path, 'home', return_value=self.home), patch.object(connect.sys, 'argv', argv or ['connect.py']), patch.object(connect.sys.stdin, 'isatty', return_value=tty), patch.object(connect.getpass, 'getpass', return_value=self.key), patch.object(connect.urllib.request, 'build_opener', return_value=opener), contextlib.redirect_stdout(output):
            connect.main()
        return output.getvalue(), opener

    def test_hidden_key_saved_privately_after_read_only_team_check(self):
        output, opener = self.invoke()
        target = self.home / '.config/world-developer/api-key'
        self.assertEqual(target.read_text().strip(), self.key)
        self.assertEqual(target.stat().st_mode & 0o777, 0o600)
        self.assertNotIn(self.key, output)
        request = opener.open.call_args.args[0]
        self.assertEqual(json.loads(request.data)['params']['name'], 'get_team_context')

    def test_noninteractive_input_is_rejected(self):
        with self.assertRaises(SystemExit):
            self.invoke(tty=False)
        self.assertFalse((self.home / '.config/world-developer/api-key').exists())

    def test_rejected_key_is_not_saved(self):
        with self.assertRaises(SystemExit):
            self.invoke(response={'error': {'code': -32001}})
        self.assertFalse((self.home / '.config/world-developer/api-key').exists())

    def test_existing_key_is_preserved_without_replace(self):
        self.invoke()
        self.key = 'api_new_fixture'
        with self.assertRaises(SystemExit):
            self.invoke()
        self.assertEqual((self.home / '.config/world-developer/api-key').read_text().strip(), 'api_fixture_key')

    def test_explicit_replace_updates_only_local_credential(self):
        self.invoke()
        self.key = 'api_new_fixture'
        output, opener = self.invoke(['connect.py', '--replace'])
        self.assertNotIn(self.key, output)
        self.assertEqual((self.home / '.config/world-developer/api-key').read_text().strip(), self.key)
        self.assertEqual(opener.open.call_count, 1)


if __name__ == '__main__':
    unittest.main()
