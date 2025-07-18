import * as yup from "yup";
import {
  allowCommonCharactersAndEmojisRegex,
  allowTitleAndEmojisRegex,
  notificationTitleSchema,
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
  ["Punctuation", "We're, asking a question? No. Yes! 🚀"],
];
const emojiFailureTestCases = [
  ["script tags", "Invalid <script>alert('xss')</script>"],
  ["HTML tags with emojis", "<div>Hello 👋</div>"],
  ["JS code", "<script>alert('obj = {}')</script>"],
  ["JS code", "<script>alert('xss const')</script>"],
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

describe("notifications", () => {
  // valid test cases
  const validTestCases = [
    ["standard text", "Hello World"],
    ["text with emojis", "Hello 👋 World"],
    ["with username placeholder", "${username} joined"],
    ["username with emojis", "${username} 🎉 welcome"],
    ["only username placeholder", "${username}"],
    ["max length valid", "A".repeat(30)],
    ["max length with username", "${username}" + "x".repeat(19)], // ${username} = 11 chars + 19 = 30
    ["punctuation", "¿We're, asking a q? No. ¡Yes!"],
  ];

  // invalid test cases
  const invalidTestCases = [
    ["empty string", ""],
    ["too long with username", "${username}" + "x".repeat(20)], // ${username} = 11 chars + 20 = 31
    ["invalid characters", "${username} {invalid}"],
  ];

  test.each(validTestCases)("should accept %s", (_, input) => {
    expect(notificationTitleSchema.isValidSync(input)).toBe(true);
  });

  test.each(invalidTestCases)("should reject %s", (_, input) => {
    expect(notificationTitleSchema.isValidSync(input)).toBe(false);
  });
});
