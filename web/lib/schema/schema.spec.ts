import * as yup from "yup";
import {
  allowCommonCharactersAndEmojisRegex,
  allowTitleAndEmojisRegex,
} from "./index";
const emojiSuccessTestCases = [
  ["standard text", "This is standard text"],
  ["text with emojis", "Hello 👋 World 🌍"],
  ["mixed content", "My App 📱 is awesome! 🚀"],
  [
    "every emoji",
    "text😀😃😄😁😆🤩😅😂🤣😊😇🙂🙃😉😌😍😘😗😙😚😋🤪😜😝😛🤑🤗🤓😎🤡🤠😏😒😞😔😟😕🙁😣😖😫😩😤😠😡🤬😶😐😑😯😦😧😮😲😵🤯😳😱😨😰😢😥🤤😭😓😪😴🥱🙄🤨🧐🤔🤫🤭🤥😬🤐🤢🤮🤧😷🤒🤕😈👿👹👺💩👻💀👽👾🤖🎃😺😸😹😻😼😽🙀😿😾👐🙌👏🙏🤲🤝👍👎👊✊🤛🤜🤞🤘🤏👌👈👉👆👇✋🤚🖐🖖👋🤙💪🖕🤟✍️🤳💅🖖💄💋👄👅👂🦻👃🦵🦶🦾🦿👣👁👀🗣👤👥👶👦👧🧒👨👩🧑👱‍♀️👱🧔👴👵🧓👲👳‍♀️👳🧕👮‍♀️👮👷‍♀️👷💂‍♀️💂🕵️‍♀️🕵️👩‍⚕️👨‍⚕️👩‍🌾👨‍🌾👩‍🍳👨‍🍳👩‍🎓👨‍🎓👩‍🎤👨‍🎤👩‍🏫👨‍🏫👩‍🏭👨‍🏭👩‍💻👨‍💻👩‍💼👨‍💼👩‍🔧👨‍🔧👩‍🔬👨‍🔬👩‍🎨👨‍🎨👩‍🚒👨‍🚒👩‍✈️👨‍✈️👩‍🚀👨‍🚀👩‍⚖️👨‍⚖️🤶🎅👸🤴👰🤵👼🤰🤱🙇‍♀️🙇💁💁‍♂️🙅🙅‍♂️🙆🙆‍♂️🙋🙋‍♂️🤦‍♀️🤦‍♂️🤷‍♀️🤷‍♂️🙎🙎‍♂️🙍🙍‍♂️💇💇‍♂️💆💆‍♂️🧖‍♀️🧖‍♂️🧏🧏‍♂️🧏‍♀️🧙‍♀️🧙‍♂️🧛‍♀️🧛‍♂️🧟‍♀️🧟‍♂️🧚‍♀️🧚‍♂️🧜‍♀️🧜‍♂️🧝‍♀️🧝‍♂️🧞‍♀️🧞‍♂️🕴💃🕺👯👯‍♂️🚶‍♀️🚶🏃‍♀️🏃🧍🧍‍♂️🧍‍♀️🧎🧎‍♂️🧎‍♀️👨‍🦯👩‍🦯👨‍🦼👩‍🦼👨‍🦽👩‍🦽🧑‍🤝‍🧑👫👭👬💑👩‍❤️‍👩👨‍❤️‍👨💏👩‍❤️‍💋‍👩👨‍❤️‍💋‍👨👪👨‍👩‍👧👨‍👩‍👧‍👦👨‍👩‍👦‍👦👨‍👩‍👧‍👧👩‍👩‍👦👩‍👩‍👧👩‍👩‍👧‍👦👩‍👩‍👦‍👦👩‍👩‍👧‍👧👨‍👨‍👦👨‍👨‍👧👨‍👨‍👧‍👦👨‍👨‍👦‍👦👨‍👨‍👧‍👧👩‍👦👩‍👧👩‍👧‍👦👩‍👦‍👦👩‍👧‍👧👨‍👦👨‍👧👨‍👧‍👦👨‍👦‍👦👨‍👧‍👧👚👕👖👔👗👙👘👠👡👢👞👟👒🎩🎓👑⛑🎒👝👛👜💼👓🕶🤿🌂🧣🧤🧥🦺🥻🩱🩲🩳🩰🧦🧢⛷🏂🏋️‍♀️🏋️🤺🤼‍♀️🤼‍♂️🤸‍♀️🤸‍♂️⛹️‍♀️⛹️🤾‍♀️🤾‍♂️🏌️‍♀️🏌️🏄‍♀️🏄🏊‍♀️🏊🤽‍♀️🤽‍♂️🚣‍♀️🚣🏇🚴‍♀️🚴🚵‍♀️🚵🤹‍♀️🤹‍♂️🧗‍♀️🧗‍♂️🧘‍♀️🧘‍♂️🥰🥵🥶🥳🥴🥺🦸🦹🧑‍🦰🧑‍🦱🧑‍🦳🧑‍🦲🧑‍⚕️🧑‍🎓🧑‍🏫🧑‍⚖️🧑‍🌾🧑‍🍳🧑‍🔧🧑‍🏭🧑‍💼🧑‍🔬🧑‍💻🧑‍🎤🧑‍🎨🧑‍✈️🧑‍🚀🧑‍🚒🧑‍🦯🧑‍🦼🧑‍🦽🦰🦱🦲🦳",
  ],
  ["CJK with emojis", "你好 👋 世界 🌍"],
];
const emojiFailureTestCases = [
  ["script tags", "Invalid <script>alert('xss')</script>"],
  ["HTML tags with emojis", "<div>Hello 👋</div>"],
];

describe("schema validators", () => {
  describe("allowTitleAndEmojisRegex", () => {
    // create a yup validator that uses our test function
    const validator = yup
      .string()
      .test(
        "valid-title-with-emojis",
        "Title can only contain letters, numbers, punctuation, emojis, and spaces",
        allowTitleAndEmojisRegex.test,
      );

    // valid test cases
    test.each(emojiSuccessTestCases)("should accept %s", (_, input) => {
      expect(validator.isValidSync(input)).toBe(true);
    });

    // invalid test cases
    test.each(emojiFailureTestCases)("should reject %s", (_, input) => {
      expect(validator.isValidSync(input)).toBe(false);
    });
  });
  describe("allowCommonCharactersAndEmojisRegex", () => {
    // create a yup validator that uses our test function
    const validator = yup
      .string()
      .test(
        "valid-common-with-emojis",
        "Text can only contain letters, numbers, punctuation, emojis, and spaces",
        allowCommonCharactersAndEmojisRegex.test,
      );

    // valid test cases
    test.each(emojiSuccessTestCases)("should accept %s", (_, input) => {
      expect(validator.isValidSync(input)).toBe(true);
    });

    // invalid test cases
    test.each(emojiFailureTestCases)("should reject %s", (_, input) => {
      expect(validator.isValidSync(input)).toBe(false);
    });
  });
});
