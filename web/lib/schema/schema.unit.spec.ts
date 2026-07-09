import * as yup from "yup";
import {
  allowCommonCharactersAndEmojisRegex,
  allowTitleAndEmojisRegex,
  entityIdSchema,
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
  describe("entityIdSchema", () => {
    it.each([
      ["standard entity id", "team_f76d3a9cebb549bf69742557278af9e1"],
      ["staging app entity id", "app_staging_6b1925816f364fbb27284a44c01bf5c9"],
      ["v4 action entity id", "action_v4_6b1925816f364fbb27284a44c01bf5c9"],
      [
        "compound prefix entity id",
        "report_appeal_6b1925816f364fbb27284a44c01bf5c9",
      ],
    ])("should accept %s", (_, input) => {
      expect(entityIdSchema.isValidSync(input)).toBe(true);
    });

    it.each([
      ["empty string", ""],
      ["missing suffix", "app_staging"],
      ["short suffix", "app_staging_6b1925816f364fbb27284a44c01bf5"],
      ["empty prefix segment", "app__6b1925816f364fbb27284a44c01bf5c9"],
    ])("should reject %s", (_, input) => {
      expect(entityIdSchema.isValidSync(input)).toBe(false);
    });
  });

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
