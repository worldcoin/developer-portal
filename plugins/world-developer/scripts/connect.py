#!/usr/bin/env python3
"""Interactive Portal credential setup. Never prints or accepts keys as CLI arguments."""
import argparse
import getpass
import json
import os
from pathlib import Path
import re
import stat
import sys
import urllib.request
import urllib.error

ENDPOINT = 'https://developer.world.org/api/mcp'


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--replace', action='store_true', help='Replace the locally saved credential; does not rotate any Portal key.')
    args = parser.parse_args()
    if os.name != 'posix' or not sys.stdin.isatty():
        parser.exit(1, 'Use an interactive POSIX terminal for hidden credential input.\n')
    root = Path.home() / '.config' / 'world-developer'
    root.mkdir(mode=0o700, parents=True, exist_ok=True)
    mode = root.lstat()
    if not stat.S_ISDIR(mode.st_mode) or mode.st_uid != os.getuid() or mode.st_mode & 0o077:
        parser.exit(1, 'Credential directory must be owned by you with mode 0700.\n')
    target = root / 'api-key'
    if (target.exists() or target.is_symlink()) and not args.replace:
        parser.exit(1, 'A local credential exists. Use --replace only to replace that saved credential.\n')
    key = getpass.getpass('Portal team API key (hidden): ').strip()
    if not re.fullmatch(r'api_[A-Za-z0-9+/_=-]+', key):
        parser.exit(1, 'Invalid team-key format. Nothing saved.\n')
    body = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': 'tools/call', 'params': {'name': 'get_team_context', 'arguments': {}}}).encode()
    req = urllib.request.Request(ENDPOINT, data=body, headers={'Content-Type': 'application/json', 'Accept': 'application/json, text/event-stream', 'Authorization': 'Bearer ' + key})
    try:
        with urllib.request.build_opener(NoRedirect).open(req, timeout=25) as res:
            response = json.loads(res.read(4 * 1024 * 1024))
        if response.get('error') or response.get('result', {}).get('isError') or 'result' not in response:
            parser.exit(1, 'Portal team check failed. Nothing saved.\n')
    except (urllib.error.URLError, ValueError, TimeoutError):
        parser.exit(1, 'Portal could not validate this credential. Nothing saved.\n')
    # Write exclusively, then atomically replace only when explicitly requested.
    import tempfile
    fd, staged = tempfile.mkstemp(prefix='.api-key-', dir=root)
    try:
        with os.fdopen(fd, 'w') as out:
            out.write(key + '\n')
            out.flush()
            os.fsync(out.fileno())
        if args.replace:
            os.replace(staged, target)
        else:
            os.link(staged, target)
        print('Portal connected. Credential saved in the private World Developer configuration directory.')
        if os.environ.get('WORLD_DEVELOPER_API_KEY'):
            print('The host environment key takes precedence. Unset or update it if it refers to a different credential.')
    finally:
        if os.path.exists(staged):
            os.unlink(staged)


if __name__ == '__main__':
    try:
        main()
    except (OSError, KeyboardInterrupt, EOFError):
        sys.exit('Credential setup did not complete. No credential value was printed.')
