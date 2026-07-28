// Generated manifest of World App icons for BasePixelStrip.
//
// Source: https://world-id-assets.com/api/v2/public/apps (app_rankings.top_apps
// + app_rankings.highlights), fetched 2026-07-27. That endpoint yields 553
// unique `logo_img_url` values across 556 entries - the 3 `highlights` apps are
// repeats of apps already in `top_apps`.
//
// CELLS in ./index.tsx has 1,645 entries, so each icon is reused 2-3x to cover
// the field. Copies of the same icon are placed at least 2 * ICON_REVEAL_RADIUS
// apart, so no two copies can ever be revealed inside a single lens - the
// duplication is invisible at the interaction level even though it is a 3x
// oversubscription overall.
//
// APPS is in the API's ranking order. CELL_APP_INDICES is parallel to CELLS
// (index i = cell i) and holds an index into APPS.

export type AppIcon = {
  appId: string;
  name: string;
  logoUrl: string;
};

export const APPS: readonly AppIcon[] = [
  {
    appId: "grants",
    name: "Worldcoin",
    logoUrl:
      "https://world-id-assets.com/app_d2905e660b94ad24d6fc97816182ab35/da7a488a-d4b8-4f30-b5c6-be42df8de4cd.png",
  },
  {
    appId: "app_9423440b86ae86ac4419912b25a9a562",
    name: "World ID Rewards",
    logoUrl:
      "https://world-id-assets.com/app_9423440b86ae86ac4419912b25a9a562/a6b757e4-9877-4dc9-b7fc-583532bc8124.jpg",
  },
  {
    appId: "app_f1e44837a5e3c2af4da8925b46027645",
    name: "ORO",
    logoUrl:
      "https://world-id-assets.com/app_f1e44837a5e3c2af4da8925b46027645/30d3e454-5939-4e88-b0c1-29642dde07e7.png",
  },
  {
    appId: "app_3876b5f39809a50bb5ebe97c997bbcf1",
    name: "ORB",
    logoUrl:
      "https://world-id-assets.com/app_3876b5f39809a50bb5ebe97c997bbcf1/2cc4ccb3-4d08-44d2-a8fa-d87e201a5ffb.png",
  },
  {
    appId: "app_ebdd8475db3238254fca5b25ccba266a",
    name: "Credit: Up to $1,000 loans",
    logoUrl:
      "https://world-id-assets.com/app_ebdd8475db3238254fca5b25ccba266a/add1deb5-21ba-4376-9f33-f8b1acfea422.png",
  },
  {
    appId: "app_e7d27c5ce2234e00558776f227f791ef",
    name: "Add Money",
    logoUrl:
      "https://world-id-assets.com/app_e7d27c5ce2234e00558776f227f791ef/04eb7079-e3b1-43a9-8578-ac65c1490adf.png",
  },
  {
    appId: "app_ee968e983074cb090e6f12cd75b63bb3",
    name: "Eggs Vault",
    logoUrl:
      "https://world-id-assets.com/app_ee968e983074cb090e6f12cd75b63bb3/20f668c3-b376-4e32-957e-e539a1c82f92.png",
  },
  {
    appId: "app_0e3f2e07cf3fb2e43fdddbb73d21d355",
    name: "Pebbler",
    logoUrl:
      "https://world-id-assets.com/app_0e3f2e07cf3fb2e43fdddbb73d21d355/988a7cb9-02da-45a6-8232-734aa160198a.jpg",
  },
  {
    appId: "app_6acbab8bc5c5fe527f5ff6201934d043",
    name: "Morpho",
    logoUrl:
      "https://world-id-assets.com/app_6acbab8bc5c5fe527f5ff6201934d043/31ac7d01-4bf4-4440-baf7-3a1e08506514.jpg",
  },
  {
    appId: "app_459cd0d0d3125864ea42bd4c19d1986c",
    name: "DropWallet",
    logoUrl:
      "https://world-id-assets.com/app_459cd0d0d3125864ea42bd4c19d1986c/23841273-b30d-4bb9-b4bf-e77c09b49103.png",
  },
  {
    appId: "app_8e5d3717d3babb59bd16948c9ff8397f",
    name: "Gift Cards",
    logoUrl:
      "https://world-id-assets.com/app_8e5d3717d3babb59bd16948c9ff8397f/1422cec6-be9c-42c3-9a77-d38592a65df3.png",
  },
  {
    appId: "app_0d4b759921490adc1f2bd569fda9b53a",
    name: "Holdstation Wallet",
    logoUrl:
      "https://world-id-assets.com/app_0d4b759921490adc1f2bd569fda9b53a/6538a7ad-c983-4b4c-966c-47e6c677a94d.png",
  },
  {
    appId: "app_8e407cfbae7ae51c19b07faff837aeeb",
    name: "DNA",
    logoUrl:
      "https://world-id-assets.com/app_8e407cfbae7ae51c19b07faff837aeeb/155e4781-23cd-479a-8b8d-71d08cdf2da5.png",
  },
  {
    appId: "app_44016c399a6c3fb33c454ef2bd19897a",
    name: "Humans vs AI",
    logoUrl:
      "https://world-id-assets.com/app_44016c399a6c3fb33c454ef2bd19897a/333ac384-d480-488a-8bfe-d1a19fa5e943.jpg",
  },
  {
    appId: "app_e1beb4eee66ec6ec4c6684d81b878ff7",
    name: "Orb App",
    logoUrl:
      "https://world-id-assets.com/app_e1beb4eee66ec6ec4c6684d81b878ff7/26602e56-e76d-4c55-b2b7-e6421c5932dd.png",
  },
  {
    appId: "app_153c9b58050f91bca861f89c5ede39d6",
    name: "FREE $WLD",
    logoUrl:
      "https://world-id-assets.com/app_153c9b58050f91bca861f89c5ede39d6/a64e1ee9-ab17-459d-84c2-2780c8162cf5.png",
  },
  {
    appId: "app_f12d676b28252ffa1937a3453590e078",
    name: "Cash Daily",
    logoUrl:
      "https://world-id-assets.com/app_f12d676b28252ffa1937a3453590e078/93306b14-f45c-4767-8f91-faf26bcc4966.png",
  },
  {
    appId: "app_071e90f11fad65ca9d9e1a0478510e89",
    name: "Lift",
    logoUrl:
      "https://world-id-assets.com/app_071e90f11fad65ca9d9e1a0478510e89/c42d494b-b219-4405-8f79-ad8ffc0cc5fa.png",
  },
  {
    appId: "app_88b0d0e3f7db546334814ff1f10a1f75",
    name: "TBD",
    logoUrl:
      "https://world-id-assets.com/app_88b0d0e3f7db546334814ff1f10a1f75/d9642137-3c84-428f-8015-335a75ad8507.png",
  },
  {
    appId: "app_6610def1aa8897c77963bb43e747c4e2",
    name: "Phone Top Ups",
    logoUrl:
      "https://world-id-assets.com/app_6610def1aa8897c77963bb43e747c4e2/83c01f09-863b-4f73-b79e-ff8253d50207.png",
  },
  {
    appId: "app_49fe40f83cfcdf67b7ba716d37e927e4",
    name: "Cash Convert",
    logoUrl:
      "https://world-id-assets.com/app_49fe40f83cfcdf67b7ba716d37e927e4/a46cf075-7706-4738-bfef-6734f34337c0.png",
  },
  {
    appId: "app_15daccf5b7d4ec9b7dbba044a8fdeab5",
    name: "PUF",
    logoUrl:
      "https://world-id-assets.com/app_15daccf5b7d4ec9b7dbba044a8fdeab5/f3a20515-cebf-4f97-80c5-1afa330fac2d.jpg",
  },
  {
    appId: "app_04be5c0d2752633311de641688a4c72b",
    name: "Squadletics",
    logoUrl:
      "https://world-id-assets.com/app_04be5c0d2752633311de641688a4c72b/6914a9e5-6b3f-4aab-870f-f85f26337f43.png",
  },
  {
    appId: "app_40cf4a75c0ac4d247999bccb1ce8f857",
    name: "Human Tap",
    logoUrl:
      "https://world-id-assets.com/app_40cf4a75c0ac4d247999bccb1ce8f857/70f1f9ee-779e-4362-8b80-94ecf2a862f4.png",
  },
  {
    appId: "app_baea7d46bd43022ca80716a70537ff29",
    name: "DeFutures",
    logoUrl:
      "https://world-id-assets.com/app_baea7d46bd43022ca80716a70537ff29/ce4f2d36-0dc4-4266-ad79-ca395c5fa789.png",
  },
  {
    appId: "app_b85f6e9b17dd59c23882f049472d395e",
    name: "Remix",
    logoUrl:
      "https://world-id-assets.com/app_b85f6e9b17dd59c23882f049472d395e/272334e7-83c6-4ae4-a6eb-550300577de1.png",
  },
  {
    appId: "app_17e9aee55413522124817be4f6e81e42",
    name: "eSIM",
    logoUrl:
      "https://world-id-assets.com/app_17e9aee55413522124817be4f6e81e42/7f65aeb9-82a8-4a04-9ec0-c9bdf4f23149.png",
  },
  {
    appId: "app_b0d01dd8f2bdfbff06c9e123de487eb8",
    name: "Earn $WLD ",
    logoUrl:
      "https://world-id-assets.com/app_b0d01dd8f2bdfbff06c9e123de487eb8/4d0dd3b4-dfde-49ad-8cc9-184d86bf0d60.jpg",
  },
  {
    appId: "app_c895e94c9c7d2ab9899b6083ad95e31d",
    name: "Worldle",
    logoUrl:
      "https://world-id-assets.com/app_c895e94c9c7d2ab9899b6083ad95e31d/39b56b90-1afd-401b-b915-28e78b58189b.png",
  },
  {
    appId: "app_d22ac26b69615797e1f3a30beaf5fccd",
    name: "CODY",
    logoUrl:
      "https://world-id-assets.com/app_d22ac26b69615797e1f3a30beaf5fccd/6458eeb4-1cf2-421f-8db8-6441dbd8a48d.png",
  },
  {
    appId: "app_795c0423db679ccd64020b91558e0abe",
    name: "EarnOS",
    logoUrl:
      "https://world-id-assets.com/app_795c0423db679ccd64020b91558e0abe/f098e391-5b8f-4575-8a29-13b71753c0f3.png",
  },
  {
    appId: "app_7cf6a578c65c4b7db84bc6734fb0e165",
    name: "DNA Wallet",
    logoUrl:
      "https://world-id-assets.com/app_7cf6a578c65c4b7db84bc6734fb0e165/25a7a9d7-8b68-4697-b410-08ff8da70ed3.png",
  },
  {
    appId: "app_733332e25e0e720f445e627385d2f1d1",
    name: "Diamond Rush",
    logoUrl:
      "https://world-id-assets.com/app_733332e25e0e720f445e627385d2f1d1/9bdaf2cb-386f-439d-9698-420e10554498.jpg",
  },
  {
    appId: "app_e5ba7c3061400e361f98ce44d8b1b9c4",
    name: "PUF Wallet",
    logoUrl:
      "https://world-id-assets.com/app_e5ba7c3061400e361f98ce44d8b1b9c4/65c84c6f-c3a0-4e61-a8fd-b5dd6d4d5a7c.png",
  },
  {
    appId: "app_9530d626e67aae0b1508f8de055903e8",
    name: "Charms",
    logoUrl:
      "https://world-id-assets.com/app_9530d626e67aae0b1508f8de055903e8/1d70e7ee-0c3c-4ae9-9f33-677fe970f263.png",
  },
  {
    appId: "app_8b1d7caeac7af6a7984c189e1dd9e3a6",
    name: "Work",
    logoUrl:
      "https://world-id-assets.com/app_8b1d7caeac7af6a7984c189e1dd9e3a6/730bd371-d1cd-4012-93e0-8878fb420abf.png",
  },
  {
    appId: "app_b6c9f2df76cdd3a3f1e63cfdfc4193c5",
    name: "Earn",
    logoUrl:
      "https://world-id-assets.com/app_b6c9f2df76cdd3a3f1e63cfdfc4193c5/900742c1-f7b6-49a6-9dbb-38b1069d13b0.png",
  },
  {
    appId: "app_ef009d364436334a4ba836d16e4f5e40",
    name: "Deals",
    logoUrl:
      "https://world-id-assets.com/app_ef009d364436334a4ba836d16e4f5e40/be0ec39e-92aa-42ef-a3cf-2b1988383c44.jpg",
  },
  {
    appId: "app_f5103a30c6fcfe9bf4115a5a73edc16e",
    name: "Flappy Orb",
    logoUrl:
      "https://world-id-assets.com/app_f5103a30c6fcfe9bf4115a5a73edc16e/068ac25b-2f54-489d-840f-d3ed4a86bb94.png",
  },
  {
    appId: "app_8aeb55d57b7be834fb8d67e2f803d258",
    name: "AXO",
    logoUrl:
      "https://world-id-assets.com/app_8aeb55d57b7be834fb8d67e2f803d258/9d5ce660-1211-4cba-b43d-f45016c48053.jpg",
  },
  {
    appId: "app_58d5965d1c7c870a12015d49adf5b759",
    name: "FIFA Rivals!",
    logoUrl:
      "https://world-id-assets.com/app_58d5965d1c7c870a12015d49adf5b759/47fccfb2-02df-480c-a5a4-a4f6637af067.png",
  },
  {
    appId: "app_dc38d1977f23660f332458e0c1ca7b58",
    name: "Superhero: AI Side-Hustle",
    logoUrl:
      "https://world-id-assets.com/app_dc38d1977f23660f332458e0c1ca7b58/d040c9cf-22c8-4d7d-b006-42508540f23d.png",
  },
  {
    appId: "app_ec193da56e4e39b91afe72c2b3a6a09b",
    name: "Otter Hub",
    logoUrl:
      "https://world-id-assets.com/app_ec193da56e4e39b91afe72c2b3a6a09b/e43ce5f2-d92f-4c9f-a10c-dd7cc61de91d.png",
  },
  {
    appId: "app_25cf6ee1d9660721e651d43cf126953a",
    name: "HumanFi - Earn Points & Daily Swap any tokens!",
    logoUrl:
      "https://world-id-assets.com/app_25cf6ee1d9660721e651d43cf126953a/d56a4c22-e3f6-469f-a203-30fd64fbeed9.png",
  },
  {
    appId: "app_eaffd104d3bda895e1df76fa3dc3c917",
    name: "Richman",
    logoUrl:
      "https://world-id-assets.com/app_eaffd104d3bda895e1df76fa3dc3c917/71dd2ee2-69c2-45d3-8bb9-4996964ab08e.png",
  },
  {
    appId: "app_ee29da9c31b571b1d07f2d22b39321dd",
    name: "Argiefy",
    logoUrl:
      "https://world-id-assets.com/app_ee29da9c31b571b1d07f2d22b39321dd/83651e02-f72b-421e-a608-5348050c30cd.png",
  },
  {
    appId: "app_e40049a2b0b344c63754a954b84308df",
    name: "World Shop",
    logoUrl:
      "https://world-id-assets.com/app_e40049a2b0b344c63754a954b84308df/e682713d-8e31-4d42-b8aa-543def767639.png",
  },
  {
    appId: "app_87ae73f8d0558b142fb9c5fc7811b8af",
    name: "Dalgona",
    logoUrl:
      "https://world-id-assets.com/app_87ae73f8d0558b142fb9c5fc7811b8af/e21044d9-763e-471d-b970-aa5a28f59ca2.jpg",
  },
  {
    appId: "app_5dee2f19cd6eef599eb6ab275a0a7523",
    name: "Sage",
    logoUrl:
      "https://world-id-assets.com/app_5dee2f19cd6eef599eb6ab275a0a7523/8c41a053-b7bc-4b19-b509-9c4729ebae13.png",
  },
  {
    appId: "app_bed4a06b2ea1c3aef0976a9670a0c645",
    name: "Donations",
    logoUrl:
      "https://world-id-assets.com/app_bed4a06b2ea1c3aef0976a9670a0c645/d27de293-581e-4d06-82fe-aac3891739aa.png",
  },
  {
    appId: "app_fe1e5743e476e0b82ea45d9831fbc6bf",
    name: "Get $MINI Daily",
    logoUrl:
      "https://world-id-assets.com/app_fe1e5743e476e0b82ea45d9831fbc6bf/b709c4e3-9d4c-4a42-9c23-f7733ce31043.jpg",
  },
  {
    appId: "app_86794ef02e4fdd6579a937e4a0d858fb",
    name: "Polls",
    logoUrl:
      "https://world-id-assets.com/app_86794ef02e4fdd6579a937e4a0d858fb/bade979c-38ad-4c4b-a459-8a6ccc1d0483.png",
  },
  {
    appId: "app_5085de40ca3e8a6186ddef077452ceed",
    name: "Tetris",
    logoUrl:
      "https://world-id-assets.com/app_5085de40ca3e8a6186ddef077452ceed/d5dee1bd-1afc-4924-a0ea-21afca53969c.jpg",
  },
  {
    appId: "app_d9589ab005e18dcf362d2ea26aef669e",
    name: "Cash Pay",
    logoUrl:
      "https://world-id-assets.com/app_d9589ab005e18dcf362d2ea26aef669e/da9674cf-b2d8-4de0-8630-cd79e6f292c1.png",
  },
  {
    appId: "app_f6e06ad770ed218915b6c65ae33774ba",
    name: "TapTapGG",
    logoUrl:
      "https://world-id-assets.com/app_f6e06ad770ed218915b6c65ae33774ba/1e595a86-a289-4263-8d60-c04bc4ce70de.png",
  },
  {
    appId: "app_24450c17b4c11c75a5070bf5a8b1e8ec",
    name: "VoxPop",
    logoUrl:
      "https://world-id-assets.com/app_24450c17b4c11c75a5070bf5a8b1e8ec/5294709a-3fc3-406a-8956-ffd658d4399e.png",
  },
  {
    appId: "app_18f37b2ab23f96d0032da81048f19914",
    name: "MintArt",
    logoUrl:
      "https://world-id-assets.com/app_18f37b2ab23f96d0032da81048f19914/5a5d3fed-eb90-4539-9205-7b9c4a80c47c.jpg",
  },
  {
    appId: "app_4593f73390a9843503ec096086b43612",
    name: "Ani Wallet",
    logoUrl:
      "https://world-id-assets.com/app_4593f73390a9843503ec096086b43612/8833cc35-e12a-4c4b-a4b0-3465c642a444.jpg",
  },
  {
    appId: "app_58ae0f8e10b16a5a9c44023be6516877",
    name: "TApp",
    logoUrl:
      "https://world-id-assets.com/app_58ae0f8e10b16a5a9c44023be6516877/e575553b-6349-4c80-a24f-550e61d69844.png",
  },
  {
    appId: "app_6c5c5717c77abe83be8814c032c3a6f9",
    name: "Swap",
    logoUrl:
      "https://world-id-assets.com/app_6c5c5717c77abe83be8814c032c3a6f9/117b7039-be5b-4413-a576-9c19efcd3385.png",
  },
  {
    appId: "app_e126da43ad6b19b387c260afeea26470",
    name: "Otter Maze Game",
    logoUrl:
      "https://world-id-assets.com/app_e126da43ad6b19b387c260afeea26470/dfba8619-4d20-4d51-b968-27434f903e42.png",
  },
  {
    appId: "app_15586c74aff1e64417f5e037a6fccde7",
    name: "Openbands",
    logoUrl:
      "https://world-id-assets.com/app_15586c74aff1e64417f5e037a6fccde7/d24679e8-9b1a-4994-a0eb-0c366ceedb11.png",
  },
  {
    appId: "app_443bd39e83f7ab076b200e630c70c772",
    name: "Bridge",
    logoUrl:
      "https://world-id-assets.com/app_443bd39e83f7ab076b200e630c70c772/a299736f-a081-4eb4-a774-e73955d2d45b.png",
  },
  {
    appId: "app_5613f2d20bf12c10b7c8a09d3cf97840",
    name: "TickX",
    logoUrl:
      "https://world-id-assets.com/app_5613f2d20bf12c10b7c8a09d3cf97840/7180f7a6-517f-4648-a69b-7b320ea3c191.png",
  },
  {
    appId: "app_0f137e3c0d3c000686e3d13f049bdb92",
    name: "Basketball",
    logoUrl:
      "https://world-id-assets.com/app_0f137e3c0d3c000686e3d13f049bdb92/4f6de9ec-6d63-4340-91a3-d1c4a679d042.png",
  },
  {
    appId: "app_8d09da48ea47a1345a82138c9ef720e2",
    name: "World Billboard",
    logoUrl:
      "https://world-id-assets.com/app_8d09da48ea47a1345a82138c9ef720e2/a265bb2c-e5aa-41ea-a8ed-9e03fdf70b6a.png",
  },
  {
    appId: "app_c94a4a7ad759a10d4301469a06c8803d",
    name: "SwipePad",
    logoUrl:
      "https://world-id-assets.com/app_c94a4a7ad759a10d4301469a06c8803d/8720f36c-ba83-45bb-b63e-0a4dfcdb11c9.jpg",
  },
  {
    appId: "app_33b2058421d1a9fe1f6a9cc0cc5b8b03",
    name: "Crypto Merge",
    logoUrl:
      "https://world-id-assets.com/app_33b2058421d1a9fe1f6a9cc0cc5b8b03/104aeb4c-5af5-4299-8c47-2ff70cd87bd4.png",
  },
  {
    appId: "app_9da0f0443ff4a0bb886c78c96c3e9b7d",
    name: "AIShi Coin",
    logoUrl:
      "https://world-id-assets.com/app_9da0f0443ff4a0bb886c78c96c3e9b7d/0b08ed87-097b-40db-9cca-b721d38c4d64.png",
  },
  {
    appId: "app_911d07e15674a4450a3a749ea7eb502b",
    name: "BRAIN BUS",
    logoUrl:
      "https://world-id-assets.com/app_911d07e15674a4450a3a749ea7eb502b/3b2faed6-161f-462c-98d3-0c4700a6e424.png",
  },
  {
    appId: "app_cc9e631ad8d8936d6a4b34a403689279",
    name: "MATCH & WIN",
    logoUrl:
      "https://world-id-assets.com/app_cc9e631ad8d8936d6a4b34a403689279/13932a59-da91-4ce5-9696-5d49b813d366.png",
  },
  {
    appId: "app_013bbbd7b5803a25c8d10d10299608e7",
    name: "Meme",
    logoUrl:
      "https://world-id-assets.com/app_013bbbd7b5803a25c8d10d10299608e7/b3628bc7-72bd-4bda-b152-7112d35db5b5.png",
  },
  {
    appId: "app_f4226f1aa308e6ef7ccca995888d155e",
    name: "Rocket Crash",
    logoUrl:
      "https://world-id-assets.com/app_f4226f1aa308e6ef7ccca995888d155e/fb9462dc-c8f2-4d86-b891-dd719ef57fbe.png",
  },
  {
    appId: "app_2c22a42ef65cef3929af0d2025617e6e",
    name: "Build An Army",
    logoUrl:
      "https://world-id-assets.com/app_2c22a42ef65cef3929af0d2025617e6e/23566db5-ca5b-4ee3-9949-60cf46542101.png",
  },
  {
    appId: "app_d4bce4c056d0cb5ec84c62c6729a66a8",
    name: "DNA GenomeX",
    logoUrl:
      "https://world-id-assets.com/app_d4bce4c056d0cb5ec84c62c6729a66a8/5f22ca91-5dee-4813-9d23-aa98b2bab203.png",
  },
  {
    appId: "app_d8925be7b5893c9904e5ebc850f0099c",
    name: "WLD Pay",
    logoUrl:
      "https://world-id-assets.com/app_d8925be7b5893c9904e5ebc850f0099c/b559ca19-9003-4592-ad35-70780f9b6bfe.png",
  },
  {
    appId: "app_0779a2d836a4a014279ab7434f98bf7b",
    name: "Human Actions",
    logoUrl:
      "https://world-id-assets.com/app_0779a2d836a4a014279ab7434f98bf7b/592eeb43-19fc-4e54-9260-0e28772d21e5.png",
  },
  {
    appId: "app_509158de1e87230f04bab48424142c5a",
    name: "Superstream: 24/7 Livestream",
    logoUrl:
      "https://world-id-assets.com/app_509158de1e87230f04bab48424142c5a/2ec80b01-feb5-4d96-a901-9bf0dc082482.png",
  },
  {
    appId: "app_a72908b9fb0c14604f2476b6e154db52",
    name: "Solitaire Showdown",
    logoUrl:
      "https://world-id-assets.com/app_a72908b9fb0c14604f2476b6e154db52/e38ff95a-601f-4f78-9344-0c7a15100ee7.png",
  },
  {
    appId: "app_9695b81e4fde0b1976f48101e527624c",
    name: "Ninja World",
    logoUrl:
      "https://world-id-assets.com/app_9695b81e4fde0b1976f48101e527624c/0162b792-93d9-4cef-8040-80078f24a9ec.jpg",
  },
  {
    appId: "app_34391413aaf741b0b7a2472892f3b260",
    name: "Boinkers Coin Party",
    logoUrl:
      "https://world-id-assets.com/app_34391413aaf741b0b7a2472892f3b260/b94b8570-dcc2-4e36-8df3-1a32785cec8e.png",
  },
  {
    appId: "app_16603dd89b5aaa23c802002c0d430b1e",
    name: "COLOR JAM",
    logoUrl:
      "https://world-id-assets.com/app_16603dd89b5aaa23c802002c0d430b1e/7e015538-12a8-4f17-83b8-06b664edbc91.jpg",
  },
  {
    appId: "app_f9d14c86a530b4e66b44b6d01e6ba454",
    name: "Love or Bot",
    logoUrl:
      "https://world-id-assets.com/app_f9d14c86a530b4e66b44b6d01e6ba454/ec30daad-a147-4c72-afc6-1c72b14b0bf2.jpg",
  },
  {
    appId: "app_2f1d45e80044b4234ea245c14b28277e",
    name: "Polymarket",
    logoUrl:
      "https://world-id-assets.com/app_2f1d45e80044b4234ea245c14b28277e/a513fc64-f64d-4618-a573-447ba59f34f1.jpg",
  },
  {
    appId: "app_8aa4f1b2bd2a0203d8b9cafcc0d1eb48",
    name: "Rival Rush",
    logoUrl:
      "https://world-id-assets.com/app_8aa4f1b2bd2a0203d8b9cafcc0d1eb48/ba98d550-09f0-49be-9b17-c12a4c03be52.jpg",
  },
  {
    appId: "app_1db2f2a20792e9b422d4825a1b379247",
    name: "TITLES",
    logoUrl:
      "https://world-id-assets.com/app_1db2f2a20792e9b422d4825a1b379247/5a23c725-dd85-4f67-a6ba-b923a9714998.png",
  },
  {
    appId: "app_3693f8d472cac653e4795f0e4931a9b8",
    name: "Get the Orb",
    logoUrl:
      "https://world-id-assets.com/app_3693f8d472cac653e4795f0e4931a9b8/0f7f2341-9bd1-4cf7-bd09-c7ccebd62a96.png",
  },
  {
    appId: "app_3d3e59fb32241b98fa1940f34f74d0a0",
    name: "Agro Earn",
    logoUrl:
      "https://world-id-assets.com/app_3d3e59fb32241b98fa1940f34f74d0a0/30df663c-d66d-4735-9030-ab862ef316fb.png",
  },
  {
    appId: "app_e728b31c0747131a8deb7b17f54e2767",
    name: "MUSICO",
    logoUrl:
      "https://world-id-assets.com/app_e728b31c0747131a8deb7b17f54e2767/c0a47e58-21c0-44c4-b262-4b04f7c08420.png",
  },
  {
    appId: "app_bd741f81dc7e30a9286ce8e3d4c4a39f",
    name: "SuperCat",
    logoUrl:
      "https://world-id-assets.com/app_bd741f81dc7e30a9286ce8e3d4c4a39f/70595366-e30c-44f2-896d-c63403af9cd1.jpg",
  },
  {
    appId: "app_8c63022b2b60500c57128b005eb349a8",
    name: "GalAxo",
    logoUrl:
      "https://world-id-assets.com/app_8c63022b2b60500c57128b005eb349a8/244f7f74-1fbd-4b9b-87d8-8bf46bea5503.jpg",
  },
  {
    appId: "app_960683747d9e6074f64601c654c8775f",
    name: "Proof of Life",
    logoUrl:
      "https://world-id-assets.com/app_960683747d9e6074f64601c654c8775f/d5c64def-cdb3-440e-95ff-cc3525c3d3c1.png",
  },
  {
    appId: "app_951659b88fd4841ec9f885333d7641a8",
    name: "Fruit Smasher - Any tap counts",
    logoUrl:
      "https://world-id-assets.com/app_951659b88fd4841ec9f885333d7641a8/cf0fafed-30b6-49d5-bf5f-776ed1a96c64.jpg",
  },
  {
    appId: "app_a1a7fb139d05d20c50af7ba30b453f91",
    name: "Uman",
    logoUrl:
      "https://world-id-assets.com/app_a1a7fb139d05d20c50af7ba30b453f91/cee795f4-90fc-4442-ba7c-48723c3f8072.jpg",
  },
  {
    appId: "app_5b5a1a91da5ddb972a86d1f740ad895c",
    name: "Craftt Pass",
    logoUrl:
      "https://world-id-assets.com/app_5b5a1a91da5ddb972a86d1f740ad895c/92ce7ad0-bb24-4ae8-9486-270b7af377aa.png",
  },
  {
    appId: "app_9d5ca95dd79f8d6d39cbba3c0b7bbe4d",
    name: "Sushi Roll",
    logoUrl:
      "https://world-id-assets.com/app_9d5ca95dd79f8d6d39cbba3c0b7bbe4d/e24592e2-75cd-4b15-be2a-cffd8461861a.png",
  },
  {
    appId: "app_ca7d2b3ff46067131f51586e59b50900",
    name: "UnScrewed!",
    logoUrl:
      "https://world-id-assets.com/app_ca7d2b3ff46067131f51586e59b50900/9ab65c05-9aed-42c1-aa6a-ce68d809f1d3.png",
  },
  {
    appId: "app_b955daf49b9d1d028465ff1400be8759",
    name: "Orbit",
    logoUrl:
      "https://world-id-assets.com/app_b955daf49b9d1d028465ff1400be8759/7a0e1209-7948-4780-bc91-da5288343466.png",
  },
  {
    appId: "app_460a0688154a51506f447288981d6493",
    name: "Real Assets: Stocks, Bonds & Gold",
    logoUrl:
      "https://world-id-assets.com/app_460a0688154a51506f447288981d6493/8b7247cb-e9ef-40e9-90d6-1a03b52bd795.png",
  },
  {
    appId: "app_cf9dace7b0104a6a151e4e26c649de3b",
    name: "PICTURE JAM!",
    logoUrl:
      "https://world-id-assets.com/app_cf9dace7b0104a6a151e4e26c649de3b/cdb89dae-ddf6-40ff-b1b8-b68296869324.png",
  },
  {
    appId: "app_ad63d9c14e898e5ddfc03a765b65dce8",
    name: "SYNC",
    logoUrl:
      "https://world-id-assets.com/app_ad63d9c14e898e5ddfc03a765b65dce8/fd2bec9b-8e8e-49b7-b24e-672ec13abf8c.jpg",
  },
  {
    appId: "app_899315723bfa2bd3c63c74f0503b14bf",
    name: "Otterverse Defender",
    logoUrl:
      "https://world-id-assets.com/app_899315723bfa2bd3c63c74f0503b14bf/3d6c4f77-6dc8-476c-a73c-922ccd076767.jpg",
  },
  {
    appId: "app_95f18a65faa2fd6a1882d6c5b473001b",
    name: "Sparks",
    logoUrl:
      "https://world-id-assets.com/app_95f18a65faa2fd6a1882d6c5b473001b/381145d2-6858-42d6-8513-47426c30891c.png",
  },
  {
    appId: "app_d6af5adf26671c48189a30218a821c80",
    name: "Knife Rain",
    logoUrl:
      "https://world-id-assets.com/app_d6af5adf26671c48189a30218a821c80/221b8b19-0918-46dc-90aa-0487c0797122.jpg",
  },
  {
    appId: "app_37195e74ed0c251be6590431ac9efec9",
    name: "Soccer Trainee",
    logoUrl:
      "https://world-id-assets.com/app_37195e74ed0c251be6590431ac9efec9/25fe6289-6371-4af9-a233-ae242c88b540.jpg",
  },
  {
    appId: "app_c35ac7dbe6bfaee48efa9496895a49a7",
    name: "Halo: Snap Receipts",
    logoUrl:
      "https://world-id-assets.com/app_c35ac7dbe6bfaee48efa9496895a49a7/554d3b38-b0b1-4e9f-9973-6188d4fc0bfa.jpg",
  },
  {
    appId: "app_94fb7c5b61533b1f95caef65194d9138",
    name: "The Drop Game",
    logoUrl:
      "https://world-id-assets.com/app_94fb7c5b61533b1f95caef65194d9138/c3530fef-f8ee-493d-98ec-b92b2f710d83.png",
  },
  {
    appId: "app_e9ff38ec52182a86a2101509db66c179",
    name: "WorldGuard",
    logoUrl:
      "https://world-id-assets.com/app_e9ff38ec52182a86a2101509db66c179/0ec44ee3-93de-4620-b188-e5246e47f66e.png",
  },
  {
    appId: "app_1b7db82485df3620434c24010ad84e2c",
    name: "HumanPay",
    logoUrl:
      "https://world-id-assets.com/app_1b7db82485df3620434c24010ad84e2c/154ef883-423f-4fca-a4dc-0348f13c71e5.png",
  },
  {
    appId: "app_993fabf4815aa5a976ecf8a44b65b366",
    name: "Cash Vault",
    logoUrl:
      "https://world-id-assets.com/app_993fabf4815aa5a976ecf8a44b65b366/b1001781-475a-4030-954b-ef0769f3b632.png",
  },
  {
    appId: "app_5489eac6be2cd3e22ec119e2756928c5",
    name: "Human Pass: Connect & Verify",
    logoUrl:
      "https://world-id-assets.com/app_5489eac6be2cd3e22ec119e2756928c5/a2683951-f9be-4b46-add0-ed1de37a3cab.png",
  },
  {
    appId: "app_fb98349be8493c53c20a5320d6a0848b",
    name: "ProTrader Wallet",
    logoUrl:
      "https://world-id-assets.com/app_fb98349be8493c53c20a5320d6a0848b/227a1293-6fc8-42ac-bf32-db260257e5f9.jpg",
  },
  {
    appId: "app_a29d57f354c7df217030d909548ba1d0",
    name: "Next Block",
    logoUrl:
      "https://world-id-assets.com/app_a29d57f354c7df217030d909548ba1d0/029903c8-28a2-4ad6-b969-47473461642d.png",
  },
  {
    appId: "app_fe3c7fbf093a0048afdee4a7c4bddc9b",
    name: "Mint your first NFT",
    logoUrl:
      "https://world-id-assets.com/app_fe3c7fbf093a0048afdee4a7c4bddc9b/26ca0755-6916-4572-b8a8-320c8dd2363b.jpg",
  },
  {
    appId: "app_faeee2c8651a8ae743b2973c5445cfd4",
    name: "Surveys",
    logoUrl:
      "https://world-id-assets.com/app_faeee2c8651a8ae743b2973c5445cfd4/0bf64afa-e6ab-42ea-b401-d43a67821d38.png",
  },
  {
    appId: "app_7097f4c3c236a5934a775cf51e4151b4",
    name: "Katch",
    logoUrl:
      "https://world-id-assets.com/app_7097f4c3c236a5934a775cf51e4151b4/6d0dda92-1144-4d22-b2a2-e5e9750cb544.jpg",
  },
  {
    appId: "app_ac590a134414dfcd2296a97f14bce1d6",
    name: "Zoom",
    logoUrl:
      "https://world-id-assets.com/app_ac590a134414dfcd2296a97f14bce1d6/d02ad86f-3b27-4473-9018-4f5acfa48177.png",
  },
  {
    appId: "app_c0afa32e1f6b82efe67cadd0a7741a6a",
    name: "$QR",
    logoUrl:
      "https://world-id-assets.com/app_c0afa32e1f6b82efe67cadd0a7741a6a/2d5c9672-621d-4b42-a6b0-a3977607ed51.png",
  },
  {
    appId: "app_517b5f574dee3764be800bc4ac45a95b",
    name: "Bounty",
    logoUrl:
      "https://world-id-assets.com/app_517b5f574dee3764be800bc4ac45a95b/6a237180-8cfd-45c1-8c62-805289060b7b.png",
  },
  {
    appId: "app_41a476ae3a937afc40b5100d5de02e3a",
    name: "Ani Ads",
    logoUrl:
      "https://world-id-assets.com/app_41a476ae3a937afc40b5100d5de02e3a/40161386-efb8-4ea7-b753-a84ce2fadb4b.png",
  },
  {
    appId: "app_0792f77a8eb28e2e67d06a078f7174c6",
    name: "Neon Ball Sort",
    logoUrl:
      "https://world-id-assets.com/app_0792f77a8eb28e2e67d06a078f7174c6/92cfda03-df7b-4867-a65a-f4e6a8ce7a34.png",
  },
  {
    appId: "app_d3e071b5b413374ea3dcc0765a1020ee",
    name: "Blanq Wallet",
    logoUrl:
      "https://world-id-assets.com/app_d3e071b5b413374ea3dcc0765a1020ee/262e6725-877a-4cd4-b738-136fd319bda3.png",
  },
  {
    appId: "app_3bad693dfd325f182719939bd9ab0aa8",
    name: "FeeBack",
    logoUrl:
      "https://world-id-assets.com/app_3bad693dfd325f182719939bd9ab0aa8/696e626f-1d30-46af-9f2f-7997e94fbd78.png",
  },
  {
    appId: "app_9872915a7a53ef9915cceb646a5cf06d",
    name: "Meritt",
    logoUrl:
      "https://world-id-assets.com/app_9872915a7a53ef9915cceb646a5cf06d/529830a1-7515-48cd-a5bc-1e374a23eba5.png",
  },
  {
    appId: "app_fa8974b2c77a879724c770556d4a9451",
    name: "Score",
    logoUrl:
      "https://world-id-assets.com/app_fa8974b2c77a879724c770556d4a9451/e880804f-3ca6-4fea-b7a3-cdad81ec94f8.png",
  },
  {
    appId: "app_d1d53da49a19e867e8d2a280ad7d2e5f",
    name: "CUDIS Ring",
    logoUrl:
      "https://world-id-assets.com/app_d1d53da49a19e867e8d2a280ad7d2e5f/4df9a57d-2d93-468a-8f77-ee6c852cd63e.png",
  },
  {
    appId: "app_abd03ee4555c36791cb3a1db27269df3",
    name: "Otterverse Marketplace",
    logoUrl:
      "https://world-id-assets.com/app_abd03ee4555c36791cb3a1db27269df3/9f15b27d-bbce-4895-a417-aa6fa077c41b.jpg",
  },
  {
    appId: "app_14667489aa3b47eff9937c45aafa3988",
    name: "AskHumans",
    logoUrl:
      "https://world-id-assets.com/app_14667489aa3b47eff9937c45aafa3988/eed5130e-eb94-471b-91e1-d6188377ec19.png",
  },
  {
    appId: "app_fb34dc437f3330dc848bf0beff8817bb",
    name: "AXO Wallet",
    logoUrl:
      "https://world-id-assets.com/app_fb34dc437f3330dc848bf0beff8817bb/d3a3ab32-0a3c-4b6d-8fae-5b6ea5e6ce22.jpg",
  },
  {
    appId: "app_a0cc9b13c1fe83525e8172a7906d1a23",
    name: "PredictHunt",
    logoUrl:
      "https://world-id-assets.com/app_a0cc9b13c1fe83525e8172a7906d1a23/f7a764ad-5c07-459f-bcdf-3a7244006980.png",
  },
  {
    appId: "app_55e99d81528891322b962a5864a015d3",
    name: "Rocket War",
    logoUrl:
      "https://world-id-assets.com/app_55e99d81528891322b962a5864a015d3/fe3fbc8a-bb8b-4302-ae87-1b7ae982b64a.jpg",
  },
  {
    appId: "app_b8bfb74d76f7b3aa51a69f1b7d134c7e",
    name: "Slice Rush",
    logoUrl:
      "https://world-id-assets.com/app_b8bfb74d76f7b3aa51a69f1b7d134c7e/396dbeee-cbd7-4686-af0a-6953d7a0cb7c.jpg",
  },
  {
    appId: "app_30d077f1ba6e3d1233042b96908f5226",
    name: "Trust Network Operator",
    logoUrl:
      "https://world-id-assets.com/app_30d077f1ba6e3d1233042b96908f5226/b6d2ef27-3da9-4936-9a48-eace429820d2.png",
  },
  {
    appId: "app_40aafd99751514ee1019ae6d9c5a1a0f",
    name: "Million Game",
    logoUrl:
      "https://world-id-assets.com/app_40aafd99751514ee1019ae6d9c5a1a0f/6f77dd66-d20b-46c2-9b98-4b5edb700fdb.png",
  },
  {
    appId: "app_404318eb5e6e97937a40b17c890f1ea3",
    name: "Melorize: AI Music",
    logoUrl:
      "https://world-id-assets.com/app_404318eb5e6e97937a40b17c890f1ea3/da250a0e-609c-4078-9cd8-98a553a5ff27.png",
  },
  {
    appId: "app_2af459e6dde8009252b71377b1706f28",
    name: "TBD Predict",
    logoUrl:
      "https://world-id-assets.com/app_2af459e6dde8009252b71377b1706f28/3bf33cb4-a778-43c2-ba16-df22afb34cef.png",
  },
  {
    appId: "app_8ef6a5c8af9dce473c8a5b6b3808308f",
    name: "SKYE",
    logoUrl:
      "https://world-id-assets.com/app_8ef6a5c8af9dce473c8a5b6b3808308f/0b8d157f-53a6-476c-9f0b-06bb0798a6b5.png",
  },
  {
    appId: "app_84d0d5db191bfd3a0690eef8a0823a4e",
    name: "World Blog",
    logoUrl:
      "https://world-id-assets.com/app_84d0d5db191bfd3a0690eef8a0823a4e/58cc8238-e49b-4dc0-9e4a-5da417d92e0a.png",
  },
  {
    appId: "app_ed77435f147afbaa372a342cecf5f0d4",
    name: "WodyCandy",
    logoUrl:
      "https://world-id-assets.com/app_ed77435f147afbaa372a342cecf5f0d4/4aa99325-beb7-478a-a992-ab74307931ea.png",
  },
  {
    appId: "app_42d692651c83a91558c7fe9711e276f0",
    name: "Wassie Whomp (BETA)",
    logoUrl:
      "https://world-id-assets.com/app_42d692651c83a91558c7fe9711e276f0/3304981e-f28c-4b9c-a1d7-7d92f837d71c.png",
  },
  {
    appId: "app_a54080d04483a77e0c846198d855154d",
    name: "Direct TopUp Games and Vouchers",
    logoUrl:
      "https://world-id-assets.com/app_a54080d04483a77e0c846198d855154d/8e06c248-e832-49ab-a2c1-455e62679db2.jpg",
  },
  {
    appId: "app_f11a49a98aab37a10e7dcfd20139f605",
    name: "Red Light Green Light: Tap to Survive",
    logoUrl:
      "https://world-id-assets.com/app_f11a49a98aab37a10e7dcfd20139f605/4491acd6-37c7-4afb-b7bc-0ca4f540da8e.png",
  },
  {
    appId: "app_2e3f02b263b80ad960d0cbb187b8bc21",
    name: "h011yw00d",
    logoUrl:
      "https://world-id-assets.com/app_2e3f02b263b80ad960d0cbb187b8bc21/77c17ffd-7414-4f79-8b2c-ed455331b33e.jpg",
  },
  {
    appId: "app_718b1068295a80c4f095dd69798d161e",
    name: "Cryptorefills",
    logoUrl:
      "https://world-id-assets.com/app_718b1068295a80c4f095dd69798d161e/8d097d08-6e1a-43d3-ae8d-bc9949d7bba2.jpg",
  },
  {
    appId: "app_f3e975e7057d004eb714b608e871bfdd",
    name: "TKN",
    logoUrl:
      "https://world-id-assets.com/app_f3e975e7057d004eb714b608e871bfdd/9f15a7ec-da5d-4671-ada5-2aa448598a2a.png",
  },
  {
    appId: "app_690afa7b2e4a8895a50ee6cd962fac8d",
    name: "Node Wallet",
    logoUrl:
      "https://world-id-assets.com/app_690afa7b2e4a8895a50ee6cd962fac8d/36f68f34-f561-4374-abcb-d5adb8556985.png",
  },
  {
    appId: "app_cf4710cf2b49627a39b2e16265cbaf2b",
    name: "Global Matrix Governor",
    logoUrl:
      "https://world-id-assets.com/app_cf4710cf2b49627a39b2e16265cbaf2b/131489ae-825d-4208-bb1a-f4eaaf846c76.jpg",
  },
  {
    appId: "app_82fc7befa2f1c7689ec1a9ed441f6226",
    name: "Tarot AI",
    logoUrl:
      "https://world-id-assets.com/app_82fc7befa2f1c7689ec1a9ed441f6226/b3c2894f-0340-4ab1-8d2f-8c9a975ae308.jpg",
  },
  {
    appId: "app_d4e315da4f65f81e27c48e65b5d9a5a9",
    name: "Loot Heroes",
    logoUrl:
      "https://world-id-assets.com/app_d4e315da4f65f81e27c48e65b5d9a5a9/779fb873-9044-4a1d-b82d-442f958c40a5.png",
  },
  {
    appId: "app_ed0902536086dd15f1a4a21b4a8404e6",
    name: "World Vote - beta",
    logoUrl:
      "https://world-id-assets.com/app_ed0902536086dd15f1a4a21b4a8404e6/6dfaccbb-798a-4517-aa4d-3d9d5262d5a6.png",
  },
  {
    appId: "app_e44e399fc0bb610caa7a32b20eae4304",
    name: "Time Vault",
    logoUrl:
      "https://world-id-assets.com/app_e44e399fc0bb610caa7a32b20eae4304/d1e60ca3-edc0-4dfb-b2fa-99b2f6392a3d.jpg",
  },
  {
    appId: "app_16c96f4c461235b11db52c6d8376d128",
    name: "Claim Race",
    logoUrl:
      "https://world-id-assets.com/app_16c96f4c461235b11db52c6d8376d128/cc4fc13b-3235-4382-8a0a-74e62bba17b0.jpg",
  },
  {
    appId: "app_2f2b4fe27805ca0d8fe407e1cedc37ea",
    name: "MAGIC TOWERS",
    logoUrl:
      "https://world-id-assets.com/app_2f2b4fe27805ca0d8fe407e1cedc37ea/04663d85-b33e-4a79-8ecc-ee88ba9ec193.jpg",
  },
  {
    appId: "app_03e335db5f419cbe090096f2cff54476",
    name: "City Dunk",
    logoUrl:
      "https://world-id-assets.com/app_03e335db5f419cbe090096f2cff54476/a35b053a-158f-423c-8387-658702ac200b.jpg",
  },
  {
    appId: "app_6016abe360ea0157510c0ef4ffe8b96b",
    name: "Pets Rush",
    logoUrl:
      "https://world-id-assets.com/app_6016abe360ea0157510c0ef4ffe8b96b/9fc84c8a-4133-4832-9a08-c224c0c8aa35.png",
  },
  {
    appId: "app_a11be267c4baa35bca6d18b3cdd6a23c",
    name: "World Companies Finder",
    logoUrl:
      "https://world-id-assets.com/app_a11be267c4baa35bca6d18b3cdd6a23c/0e10d2bd-8fa5-4232-8db0-9936033400ce.png",
  },
  {
    appId: "app_3a710b9b423c5cdfe8b6c1df927e542b",
    name: "RICK Loans",
    logoUrl:
      "https://world-id-assets.com/app_3a710b9b423c5cdfe8b6c1df927e542b/941991c8-ec19-4166-bb20-172b51131093.png",
  },
  {
    appId: "app_001af3a712b806586c6972b9259add85",
    name: "Bestie",
    logoUrl:
      "https://world-id-assets.com/app_001af3a712b806586c6972b9259add85/65f25b97-6447-43b7-9ee4-c53dbd59f512.png",
  },
  {
    appId: "app_65a1da4d0cddd582aa5ebcd90b37575e",
    name: "Oku Trade",
    logoUrl:
      "https://world-id-assets.com/app_65a1da4d0cddd582aa5ebcd90b37575e/c8464d00-9857-4ba2-8b18-47b3cc0a39e7.png",
  },
  {
    appId: "app_90efc0901eff4b3e2a0d798f10813db3",
    name: "BYT Rewards",
    logoUrl:
      "https://world-id-assets.com/app_90efc0901eff4b3e2a0d798f10813db3/43adfd20-5f75-4870-b888-45f11be5afa4.jpg",
  },
  {
    appId: "app_b8f69265fd23302eef25595ef2dfa059",
    name: "Olena",
    logoUrl:
      "https://world-id-assets.com/app_b8f69265fd23302eef25595ef2dfa059/de487010-db33-42d7-aae4-c273dfdfe150.png",
  },
  {
    appId: "app_a9abb209455ff4a3820959d616d72f02",
    name: "Human Place",
    logoUrl:
      "https://world-id-assets.com/app_a9abb209455ff4a3820959d616d72f02/07383dd3-fb10-474f-a60c-f8672383a820.png",
  },
  {
    appId: "app_02bc498b6f3c6c1594e100ed1451e6d3",
    name: "Kumo TV",
    logoUrl:
      "https://world-id-assets.com/app_02bc498b6f3c6c1594e100ed1451e6d3/e4732ef4-da4e-4969-b744-3e169df84668.jpg",
  },
  {
    appId: "app_794267e0875ee164178f921b4fea9784",
    name: "The Map: Own the Message",
    logoUrl:
      "https://world-id-assets.com/app_794267e0875ee164178f921b4fea9784/f0ac24a1-41d5-4cff-9ace-f409aa0ea890.jpg",
  },
  {
    appId: "app_c6156cefc4f84a13cdb2da41306e04e2",
    name: "Offramp",
    logoUrl:
      "https://world-id-assets.com/app_c6156cefc4f84a13cdb2da41306e04e2/30e7fe9c-75f9-45e7-8db5-6f0e293d3547.png",
  },
  {
    appId: "app_aa83a7a416177d07a2ae1d6aba48d41b",
    name: "Block Puzzle",
    logoUrl:
      "https://world-id-assets.com/app_aa83a7a416177d07a2ae1d6aba48d41b/a6499dc4-760c-4b80-a224-1b244589ee0f.png",
  },
  {
    appId: "app_b5e6bcbac5485a196ad1bc53c4cb9737",
    name: "Mystic Forge",
    logoUrl:
      "https://world-id-assets.com/app_b5e6bcbac5485a196ad1bc53c4cb9737/d258a3f4-4a8c-4660-997e-870e69cd389c.png",
  },
  {
    appId: "app_17add0ea360017d9ed307f8913dd4a0e",
    name: "Flights Cryptorefills",
    logoUrl:
      "https://world-id-assets.com/app_17add0ea360017d9ed307f8913dd4a0e/a239c7ea-b175-4ef1-81ec-a664b7119649.jpg",
  },
  {
    appId: "app_89e14363929c19ada53ddccfb35b2a5e",
    name: "YAMMIEZ",
    logoUrl:
      "https://world-id-assets.com/app_89e14363929c19ada53ddccfb35b2a5e/0d4ac0c3-23a9-4559-bbc4-4c06cc970e8b.png",
  },
  {
    appId: "app_add5a6b415644d6d0e8ec9479f0415de",
    name: "VIBE",
    logoUrl:
      "https://world-id-assets.com/app_add5a6b415644d6d0e8ec9479f0415de/dd667e74-0f26-4863-bb0b-74e74d56007e.jpg",
  },
  {
    appId: "app_81984da0ce37b246c52f169fd7c3f082",
    name: "Drop",
    logoUrl:
      "https://world-id-assets.com/app_81984da0ce37b246c52f169fd7c3f082/d1ee9e49-1a4c-447e-a217-7df7f135d20c.png",
  },
  {
    appId: "app_3df51ac31833b1b918976e4c92e7bbfa",
    name: "SabeGol｜The sports prediction platform",
    logoUrl:
      "https://world-id-assets.com/app_3df51ac31833b1b918976e4c92e7bbfa/3da9c540-2766-4d78-af83-28a3a173cf92.png",
  },
  {
    appId: "app_5f0ca1e8dd421f3cd463e92f45d0c05e",
    name: "ATERA",
    logoUrl:
      "https://world-id-assets.com/app_5f0ca1e8dd421f3cd463e92f45d0c05e/ca2ab782-f801-41ed-933d-4e0e87e0cb60.png",
  },
  {
    appId: "app_2e9e8626d1f49c4c86ef00a04b7b6062",
    name: "Canopy",
    logoUrl:
      "https://world-id-assets.com/app_2e9e8626d1f49c4c86ef00a04b7b6062/3832237b-109f-4ecb-ab78-8a52b5f5522a.png",
  },
  {
    appId: "app_77a67318af516eaf92926e46064eb30f",
    name: "Quali",
    logoUrl:
      "https://world-id-assets.com/app_77a67318af516eaf92926e46064eb30f/c7db6512-c509-42e1-88a8-1c08d8a1539c.jpg",
  },
  {
    appId: "app_a297091a4299bab011af3c3f7bd7d32c",
    name: "Kalshi",
    logoUrl:
      "https://world-id-assets.com/app_a297091a4299bab011af3c3f7bd7d32c/86d25033-8e55-4fb5-84fd-884e18539757.png",
  },
  {
    appId: "app_7944ecfae22972b5f4955a9412000931",
    name: "TIME",
    logoUrl:
      "https://world-id-assets.com/app_7944ecfae22972b5f4955a9412000931/dd172ba9-4116-4b17-8797-f78617d29379.jpg",
  },
  {
    appId: "app_e6613129c4acc221bd67e4242767588c",
    name: "Mini Brain Games",
    logoUrl:
      "https://world-id-assets.com/app_e6613129c4acc221bd67e4242767588c/156618ff-482d-4812-ad55-20c3d124a928.png",
  },
  {
    appId: "app_c2dc3f5e8da16f8bde64348accb314e3",
    name: "Link2Earn: Link Social, Passive $ Income",
    logoUrl:
      "https://world-id-assets.com/app_c2dc3f5e8da16f8bde64348accb314e3/418a1383-fe12-4d7e-97d9-452c1c4c9be2.png",
  },
  {
    appId: "app_31270d347fdd87eb3fbd9f5357c0540b",
    name: "BloomChain",
    logoUrl:
      "https://world-id-assets.com/app_31270d347fdd87eb3fbd9f5357c0540b/5f347650-ab2d-4427-99f4-7c1e152e0bf0.jpg",
  },
  {
    appId: "app_821e7b27df790d0da742c58230d93499",
    name: "Lua AI Challenge",
    logoUrl:
      "https://world-id-assets.com/app_821e7b27df790d0da742c58230d93499/9a4ee5f7-8041-49f4-a25f-2e13931b6a7b.jpg",
  },
  {
    appId: "app_1ff1e61e8714b89818a8d1bfdfc742d9",
    name: "Reactor Fusion",
    logoUrl:
      "https://world-id-assets.com/app_1ff1e61e8714b89818a8d1bfdfc742d9/710a4ced-9883-4a49-bc89-1c5432bf40cd.png",
  },
  {
    appId: "app_73c5e4221add70bae4ab73cfe37670d4",
    name: "VidLook",
    logoUrl:
      "https://world-id-assets.com/app_73c5e4221add70bae4ab73cfe37670d4/e7a1447b-84cc-41b7-9b3b-f31d1baa2620.png",
  },
  {
    appId: "app_da5e99e4ea2bfa958e52d18cde22905c",
    name: "Dragon Onet Master",
    logoUrl:
      "https://world-id-assets.com/app_da5e99e4ea2bfa958e52d18cde22905c/33c1b588-376c-4826-a8e3-36acb2ba17a6.jpg",
  },
  {
    appId: "app_a56872478b687ab4d5cb8cb40348b168",
    name: "Quizzly",
    logoUrl:
      "https://world-id-assets.com/app_a56872478b687ab4d5cb8cb40348b168/5111c7d9-5abe-41df-af2e-24fa0625aa99.png",
  },
  {
    appId: "app_743a529bcdabe926b060fc1c26d38fcb",
    name: "Vivo",
    logoUrl:
      "https://world-id-assets.com/app_743a529bcdabe926b060fc1c26d38fcb/beb39c8c-fa87-4986-a90b-be212caae876.png",
  },
  {
    appId: "app_0591bbb93ff35e35a832560f666ac966",
    name: "Scoreline",
    logoUrl:
      "https://world-id-assets.com/app_0591bbb93ff35e35a832560f666ac966/6d967795-a768-4c31-97f5-f43fa9955243.png",
  },
  {
    appId: "app_ada80aeb99aa99a4aa587b4c11bef26f",
    name: "Kumo Wallet",
    logoUrl:
      "https://world-id-assets.com/app_ada80aeb99aa99a4aa587b4c11bef26f/cff7bba0-89e7-4a33-baef-49864a193128.jpg",
  },
  {
    appId: "app_f6140649c39b0a7371d4303ad3b3a861",
    name: "Idol: Beauty contests",
    logoUrl:
      "https://world-id-assets.com/app_f6140649c39b0a7371d4303ad3b3a861/22caafe5-0f5e-4690-9427-f621baada6f0.jpg",
  },
  {
    appId: "app_e4ae218211628d94881118d63ab9b79a",
    name: "Pond",
    logoUrl:
      "https://world-id-assets.com/app_e4ae218211628d94881118d63ab9b79a/c89d4beb-947e-4858-a81f-611d01555e97.jpg",
  },
  {
    appId: "app_1b38371371d91bee1ca90bf7aab1da60",
    name: "Gusta",
    logoUrl:
      "https://world-id-assets.com/app_1b38371371d91bee1ca90bf7aab1da60/219f1db0-e75e-4252-a1a4-3b7c414d7dc0.jpg",
  },
  {
    appId: "app_6045d472bcc1af5452717d16e0d92f75",
    name: "Captcha: Social for Humans",
    logoUrl:
      "https://world-id-assets.com/app_6045d472bcc1af5452717d16e0d92f75/895a4930-3610-4dca-8430-7ddb970fe4cc.png",
  },
  {
    appId: "app_d29cf8cfeea14e69f286af1803e296d2",
    name: "Hotels Cryptorefills",
    logoUrl:
      "https://world-id-assets.com/app_d29cf8cfeea14e69f286af1803e296d2/0f317db3-ee76-4ef7-bceb-61c89dbb5f4c.jpg",
  },
  {
    appId: "app_d826abbcef7ac8a14db406b6d2f7562d",
    name: "Nekron",
    logoUrl:
      "https://world-id-assets.com/app_d826abbcef7ac8a14db406b6d2f7562d/9d766d4f-77e6-4138-8769-2676b88bc2f5.jpg",
  },
  {
    appId: "app_51eb1ea7f829e4faf7c5f165caebf6a3",
    name: "Bridge Money",
    logoUrl:
      "https://world-id-assets.com/app_51eb1ea7f829e4faf7c5f165caebf6a3/e3cde9ae-d0aa-4b38-b507-54f93ef96e53.jpg",
  },
  {
    appId: "app_67623c58e48389511898ef2246137aac",
    name: "WalletStats",
    logoUrl:
      "https://world-id-assets.com/app_67623c58e48389511898ef2246137aac/64eb5a2f-4923-441c-8069-30e593d34dc5.jpg",
  },
  {
    appId: "app_686114a780e5485610228bc289fc8ace",
    name: "NoBots Trade",
    logoUrl:
      "https://world-id-assets.com/app_686114a780e5485610228bc289fc8ace/9eb24634-e1ee-4eeb-bec6-5a8eea0ebc0e.png",
  },
  {
    appId: "app_e594e0c3a2dbc31ca956ab9477d4ae2a",
    name: "SEED Farm",
    logoUrl:
      "https://world-id-assets.com/app_e594e0c3a2dbc31ca956ab9477d4ae2a/8236251b-3547-457d-8499-7629b011190a.png",
  },
  {
    appId: "app_c40499d1b2b1103c51a7da0f396c8114",
    name: "DJ Dreams",
    logoUrl:
      "https://world-id-assets.com/app_c40499d1b2b1103c51a7da0f396c8114/774c7327-ef68-4a67-8ae3-8742b50366d0.png",
  },
  {
    appId: "app_68b40ef61e9ad3ae2e0ddfc5bad452a0",
    name: "TradingSim",
    logoUrl:
      "https://world-id-assets.com/app_68b40ef61e9ad3ae2e0ddfc5bad452a0/9511efc3-f191-44ba-953b-03c01c9229af.png",
  },
  {
    appId: "app_f5bcb84b9dc9905572c323addb32a432",
    name: "El Dorado",
    logoUrl:
      "https://world-id-assets.com/app_f5bcb84b9dc9905572c323addb32a432/fc52a84a-533d-4fcd-8a4a-3a56da73adf2.png",
  },
  {
    appId: "app_d5ce06da6dfce9a542a73ef8460d3a33",
    name: "Ball Fun",
    logoUrl:
      "https://world-id-assets.com/app_d5ce06da6dfce9a542a73ef8460d3a33/45d665a3-e55a-44c2-8d27-1d87fadd3969.jpg",
  },
  {
    appId: "app_fd8485420e315e6c1b745e168b9044b5",
    name: "CapSha",
    logoUrl:
      "https://world-id-assets.com/app_fd8485420e315e6c1b745e168b9044b5/0da0063f-5024-456f-8e70-d0c5278ef690.jpg",
  },
  {
    appId: "app_04f56458404931065bcab5b4a8d63ce3",
    name: "SURGE",
    logoUrl:
      "https://world-id-assets.com/app_04f56458404931065bcab5b4a8d63ce3/408f05a7-478e-4415-b3c6-c2c7a96ee70b.jpg",
  },
  {
    appId: "app_9d4dc064fd85c0182e44b7f7fa65c231",
    name: "Football Manager",
    logoUrl:
      "https://world-id-assets.com/app_9d4dc064fd85c0182e44b7f7fa65c231/a0647990-9b2f-4400-9020-0108f3d145dc.jpg",
  },
  {
    appId: "app_0b9d1fc456c95db725c5d5ec70c66926",
    name: "Boost",
    logoUrl:
      "https://world-id-assets.com/app_0b9d1fc456c95db725c5d5ec70c66926/df9ca8a8-d577-4032-a051-e4213e1b4958.jpg",
  },
  {
    appId: "app_b30d286978976be0e18ee01872a212e2",
    name: "EtherHub",
    logoUrl:
      "https://world-id-assets.com/app_b30d286978976be0e18ee01872a212e2/8c461b48-e503-42ac-b055-ea66d1b3295d.png",
  },
  {
    appId: "app_82d5214dec1f633f7ea0dc61964d60d0",
    name: "Human Vault",
    logoUrl:
      "https://world-id-assets.com/app_82d5214dec1f633f7ea0dc61964d60d0/e49cc75c-70a5-4221-90af-7519da0bdf26.png",
  },
  {
    appId: "app_46bd6463a524cd6518471e911fb44648",
    name: "Fear Or Greed",
    logoUrl:
      "https://world-id-assets.com/app_46bd6463a524cd6518471e911fb44648/81e81775-791b-45fe-8435-d7f5ec095c29.png",
  },
  {
    appId: "app_c9fdcdd0cfc23e7bee04ea4cb0194a25",
    name: "WR BOUNTY",
    logoUrl:
      "https://world-id-assets.com/app_c9fdcdd0cfc23e7bee04ea4cb0194a25/78d6da50-e868-4edc-a394-df7a3789469b.jpg",
  },
  {
    appId: "app_67b6dfad1f32e4a8339e4d67e5ba1e56",
    name: "Cube Tower",
    logoUrl:
      "https://world-id-assets.com/app_67b6dfad1f32e4a8339e4d67e5ba1e56/f53a9fa6-1c96-4a77-b7f5-144b975834a2.jpg",
  },
  {
    appId: "app_a3a429027067bbea90ccbea4aecfa2bb",
    name: "Genuine",
    logoUrl:
      "https://world-id-assets.com/app_a3a429027067bbea90ccbea4aecfa2bb/273df252-8869-452f-8adb-fd3088eabb54.png",
  },
  {
    appId: "app_d70eea16f00d8cb9b7203d28aabba623",
    name: "CoPilot AI",
    logoUrl:
      "https://world-id-assets.com/app_d70eea16f00d8cb9b7203d28aabba623/e1cb5242-0988-4684-a843-7da2b3f438b7.png",
  },
  {
    appId: "app_263f86463869627f1183badc977e21a3",
    name: "intori",
    logoUrl:
      "https://world-id-assets.com/app_263f86463869627f1183badc977e21a3/0fe91e99-6283-4eff-a72e-79dfab6d6c36.png",
  },
  {
    appId: "app_1924c84906a3f2fd39689e97c6b0f268",
    name: "Vouch",
    logoUrl:
      "https://world-id-assets.com/app_1924c84906a3f2fd39689e97c6b0f268/36322a8b-1725-4b04-84d1-ca82789b6629.png",
  },
  {
    appId: "app_920c1c9a0cb3aaa68e626f54c09f3cf9",
    name: "OrbId Wallet",
    logoUrl:
      "https://world-id-assets.com/app_920c1c9a0cb3aaa68e626f54c09f3cf9/8341748a-3884-41d9-85f2-bded9ff77ef9.jpg",
  },
  {
    appId: "app_7fa1be8b4c09c0e527b9c9fba157b617",
    name: "Galaxy Attack",
    logoUrl:
      "https://world-id-assets.com/app_7fa1be8b4c09c0e527b9c9fba157b617/af5dd8ef-fefa-4766-87a6-3b7b6ce6de21.png",
  },
  {
    appId: "app_10ca32093aa9ad0e52bc812d63daf818",
    name: "VUNI",
    logoUrl:
      "https://world-id-assets.com/app_10ca32093aa9ad0e52bc812d63daf818/c31a7686-0a05-4965-bef7-6cdf634f116e.jpg",
  },
  {
    appId: "app_53922649e1f525cdfa60350423cbbb8a",
    name: "Gigbot",
    logoUrl:
      "https://world-id-assets.com/app_53922649e1f525cdfa60350423cbbb8a/cc7206b2-9d75-43e3-b1eb-55e57448481c.png",
  },
  {
    appId: "app_8ab69c03a38dd326a157f54ee2bf285f",
    name: "Empire",
    logoUrl:
      "https://world-id-assets.com/app_8ab69c03a38dd326a157f54ee2bf285f/773be975-0ad4-4028-bb84-728d95736688.jpg",
  },
  {
    appId: "app_d5d653cf53aa11ff784f3380392999c1",
    name: "Main's World",
    logoUrl:
      "https://world-id-assets.com/app_d5d653cf53aa11ff784f3380392999c1/ff0becdd-d58b-4127-a31d-29b22f6aa7b6.jpg",
  },
  {
    appId: "app_75e89703b9b71aa5bb5806fe71e8f4be",
    name: "Human IQ",
    logoUrl:
      "https://world-id-assets.com/app_75e89703b9b71aa5bb5806fe71e8f4be/1f808401-e85f-4d90-88fa-2178a43b8dda.png",
  },
  {
    appId: "app_abe12743b49e43387beeceb29793d3b1",
    name: "True!Perks",
    logoUrl:
      "https://world-id-assets.com/app_abe12743b49e43387beeceb29793d3b1/f4f2cb63-9fc9-4071-8cd1-218983a211d8.png",
  },
  {
    appId: "app_8c38e825e798ab929b7fbab311afb6a4",
    name: "mint.one",
    logoUrl:
      "https://world-id-assets.com/app_8c38e825e798ab929b7fbab311afb6a4/d8e930f9-df10-4695-bcef-28c8627e320d.png",
  },
  {
    appId: "app_d4061dd1d8499b88aa7bc8450a385616",
    name: "Goblin Grinder",
    logoUrl:
      "https://world-id-assets.com/app_d4061dd1d8499b88aa7bc8450a385616/5567d70c-2e15-4ae2-869c-35ca4b1e8d94.png",
  },
  {
    appId: "app_9f8a5c8390e5f523b4297af8e27c5ec7",
    name: "Music",
    logoUrl:
      "https://world-id-assets.com/app_9f8a5c8390e5f523b4297af8e27c5ec7/19beeeb2-5ed6-4c0f-be47-e4d35f4a4141.png",
  },
  {
    appId: "app_65762e7de692961dbea3a640efa0a47a",
    name: "Hitman Duck",
    logoUrl:
      "https://world-id-assets.com/app_65762e7de692961dbea3a640efa0a47a/a64260e7-2af1-4712-a7d4-3a8872c133e1.jpg",
  },
  {
    appId: "app_a4e2de774b1bda0426e78cda2ddb8cfd",
    name: "Instaclaw",
    logoUrl:
      "https://world-id-assets.com/app_a4e2de774b1bda0426e78cda2ddb8cfd/0d988df0-4761-480c-903f-fd7c2f8403c5.png",
  },
  {
    appId: "app_60c81a00d5e63fd32a17c952101d632e",
    name: "WorldView",
    logoUrl:
      "https://world-id-assets.com/app_60c81a00d5e63fd32a17c952101d632e/9e418b67-56fb-44a7-b419-09bc5fbe00d6.png",
  },
  {
    appId: "app_0411bde5412fe557a6551a15a15f38b2",
    name: "Muse AI Memory Bank",
    logoUrl:
      "https://world-id-assets.com/app_0411bde5412fe557a6551a15a15f38b2/58023a66-0ecc-4ed4-ad63-2494048223a1.png",
  },
  {
    appId: "app_f9218f4fb9cd267a66aa90cb356b8359",
    name: "Difference Fun",
    logoUrl:
      "https://world-id-assets.com/app_f9218f4fb9cd267a66aa90cb356b8359/0f5aeb03-b1be-47a0-a9ff-fd0452bd2792.jpg",
  },
  {
    appId: "app_cc82843875fbd790cf69634a03243d58",
    name: "Lolo",
    logoUrl:
      "https://world-id-assets.com/app_cc82843875fbd790cf69634a03243d58/fb4586a3-f810-4eb5-b13d-63ddc37da485.jpg",
  },
  {
    appId: "app_6513df6c491ae60169b711cfd0902095",
    name: "Link",
    logoUrl:
      "https://world-id-assets.com/app_6513df6c491ae60169b711cfd0902095/ef89b72a-9d50-49aa-a53b-628454414d3a.png",
  },
  {
    appId: "app_ae7cbd7de5a6c8e6765fe1fdd8d56cc5",
    name: "Diamond Hands: Daily Rewards",
    logoUrl:
      "https://world-id-assets.com/app_ae7cbd7de5a6c8e6765fe1fdd8d56cc5/2561661f-3c73-4978-8739-3d3ff8b7e0b4.png",
  },
  {
    appId: "app_736b823f2c206a65593d086426627209",
    name: "PoolTogether Withdraw",
    logoUrl:
      "https://world-id-assets.com/app_736b823f2c206a65593d086426627209/6fdf9bcd-f706-4e7b-be2c-9a5d48403395.png",
  },
  {
    appId: "app_e3c317455f168a14ab972dbe4f34ab9a",
    name: "Void Collector",
    logoUrl:
      "https://world-id-assets.com/app_e3c317455f168a14ab972dbe4f34ab9a/1fc93c48-4e5f-47a8-a66a-ceee5b3e78c0.png",
  },
  {
    appId: "app_34e4c5f54bd0e73eedc8cb7f6ca9a584",
    name: "NFT",
    logoUrl:
      "https://world-id-assets.com/app_34e4c5f54bd0e73eedc8cb7f6ca9a584/374c3f3a-ed5c-411a-9dae-f566d93f7d4a.jpg",
  },
  {
    appId: "app_743401e3bbed2f8045c0963167d39619",
    name: "AIShi Games",
    logoUrl:
      "https://world-id-assets.com/app_743401e3bbed2f8045c0963167d39619/6e2e072a-1f2e-4146-a83b-5a8b970545a3.png",
  },
  {
    appId: "app_db6b99c1c46564a9be31150375bd4532",
    name: "Boom Boi",
    logoUrl:
      "https://world-id-assets.com/app_db6b99c1c46564a9be31150375bd4532/a3c9fe27-2202-4afa-9d5c-56eb863e97fb.jpg",
  },
  {
    appId: "app_bb9848f309258dfb2ddc4688b5e5497f",
    name: "Mirror AI",
    logoUrl:
      "https://world-id-assets.com/app_bb9848f309258dfb2ddc4688b5e5497f/77ba28a9-856d-4af5-a4c1-ed4c0260482c.png",
  },
  {
    appId: "app_5c12f88f76ae6e2d286671165156e2a4",
    name: "Tabula Rasa",
    logoUrl:
      "https://world-id-assets.com/app_5c12f88f76ae6e2d286671165156e2a4/7ceb6723-fe23-440e-a5f9-16c1f93f29a9.jpg",
  },
  {
    appId: "app_7cb26ab7bcbdd62a1bcb3c6353f0b957",
    name: "PSIG",
    logoUrl:
      "https://world-id-assets.com/app_7cb26ab7bcbdd62a1bcb3c6353f0b957/7700850a-baee-4bf8-b091-655f4c9067de.png",
  },
  {
    appId: "app_b8658a24c04c80d86407fcc08d3b9d34",
    name: "Hide & Seek World",
    logoUrl:
      "https://world-id-assets.com/app_b8658a24c04c80d86407fcc08d3b9d34/84bf559b-7d58-4c7c-ba04-f78e1d5cdf0a.png",
  },
  {
    appId: "app_5428b82ceea219630b42284b9710e09a",
    name: "DIGI",
    logoUrl:
      "https://world-id-assets.com/app_5428b82ceea219630b42284b9710e09a/c21ffe08-215d-4670-9afb-0ca7b70f075c.png",
  },
  {
    appId: "app_8c587d274eb7faf8ca960f65c6291b1d",
    name: "Shootero",
    logoUrl:
      "https://world-id-assets.com/app_8c587d274eb7faf8ca960f65c6291b1d/3601a057-5ccb-4918-a34a-aae7247abf5e.jpg",
  },
  {
    appId: "app_598d9fc901c8a2461d629501c4849c8a",
    name: "HumanityPulse",
    logoUrl:
      "https://world-id-assets.com/app_598d9fc901c8a2461d629501c4849c8a/251c43cc-4298-4f79-8f20-2aa33ad0373a.jpg",
  },
  {
    appId: "app_166f8b7aab05b789c539635bbe43cb00",
    name: "store139transfer",
    logoUrl:
      "https://world-id-assets.com/app_166f8b7aab05b789c539635bbe43cb00/71c0467b-03a7-472a-bf1e-b74b048547a3.png",
  },
  {
    appId: "app_6bade439d74a11c5fbeaa1dfe17f40cc",
    name: "Moral Arena",
    logoUrl:
      "https://world-id-assets.com/app_6bade439d74a11c5fbeaa1dfe17f40cc/e53bdfec-ebda-429d-a478-5ffe52a2186a.png",
  },
  {
    appId: "app_bb340a600f497ff8f54d0ea47231c3a5",
    name: "Labubufy",
    logoUrl:
      "https://world-id-assets.com/app_bb340a600f497ff8f54d0ea47231c3a5/300df6b0-95dd-4a05-a51a-7295b1669235.png",
  },
  {
    appId: "app_e2939cd36f19dc5503c5f2b85abe8aa8",
    name: "AIShiteru chat",
    logoUrl:
      "https://world-id-assets.com/app_e2939cd36f19dc5503c5f2b85abe8aa8/10814225-5be7-4e90-b884-c2e1261fcb8e.jpg",
  },
  {
    appId: "app_18ab665269a0fb3984bedab36a4ad561",
    name: "Cocktail Sort",
    logoUrl:
      "https://world-id-assets.com/app_18ab665269a0fb3984bedab36a4ad561/04628b31-4d04-475b-b285-a89938f13036.jpg",
  },
  {
    appId: "app_f61d803c22350091058a3ee2e9e09fa8",
    name: "InfinityAI",
    logoUrl:
      "https://world-id-assets.com/app_f61d803c22350091058a3ee2e9e09fa8/8db23b62-d2e6-4656-bd77-14f1fb41ce46.jpg",
  },
  {
    appId: "app_7e8772cda603458c1ad4babab54c8ce7",
    name: "Your Next Pal",
    logoUrl:
      "https://world-id-assets.com/app_7e8772cda603458c1ad4babab54c8ce7/d25e9ada-7b6a-4396-aa19-a501c2ac666c.png",
  },
  {
    appId: "app_47624de031399a239e694648c10ba923",
    name: "BitSkyGame",
    logoUrl:
      "https://world-id-assets.com/app_47624de031399a239e694648c10ba923/cbe9998d-22fc-4c42-8467-d0e056d10b26.png",
  },
  {
    appId: "app_35129069c1be5a2bd88dd38d8cd68a50",
    name: "Bubble Bluster",
    logoUrl:
      "https://world-id-assets.com/app_35129069c1be5a2bd88dd38d8cd68a50/cf22a428-58ba-455f-972b-82599857caf3.png",
  },
  {
    appId: "app_e6e0a75bd271b4d42af8e1fd79e14409",
    name: "Credence",
    logoUrl:
      "https://world-id-assets.com/app_e6e0a75bd271b4d42af8e1fd79e14409/b0979e2c-e21a-4be3-8405-8455e69383cc.png",
  },
  {
    appId: "app_5618f09bcb54053fbf830b51dbc73da6",
    name: "EarnGuide",
    logoUrl:
      "https://world-id-assets.com/app_5618f09bcb54053fbf830b51dbc73da6/67917bd0-d7d2-4623-b8c3-e6043c38bd72.png",
  },
  {
    appId: "app_fc3fdab7a71392a5224ded2dd2a9d08c",
    name: "Banner Hub",
    logoUrl:
      "https://world-id-assets.com/app_fc3fdab7a71392a5224ded2dd2a9d08c/b5c7724e-4689-4aa2-9466-f862e67a45c9.jpg",
  },
  {
    appId: "app_8c6951a398e8ca863af996e821eb2d52",
    name: "WARMYSSION",
    logoUrl:
      "https://world-id-assets.com/app_8c6951a398e8ca863af996e821eb2d52/3dc50a9b-d312-40cd-969e-f8c245f5f35c.png",
  },
  {
    appId: "app_1325590145579e6d6df0809d48040738",
    name: "Newsworthy",
    logoUrl:
      "https://world-id-assets.com/app_1325590145579e6d6df0809d48040738/5f142b63-4dd0-45a6-b2b8-92f119839af1.png",
  },
  {
    appId: "app_436c847813b2da99e0ff11f4996d13a1",
    name: "AudiDrop",
    logoUrl:
      "https://world-id-assets.com/app_436c847813b2da99e0ff11f4996d13a1/bc08cdb4-b318-4693-a0b0-58726b6698e1.png",
  },
  {
    appId: "app_199e9be616ba5211fa20c693538a9f6a",
    name: "Tiny Solitaire",
    logoUrl:
      "https://world-id-assets.com/app_199e9be616ba5211fa20c693538a9f6a/cbe0019e-bc43-4699-8f67-2bb8263dc285.png",
  },
  {
    appId: "app_148a7f5e6147bb572b4153fdb012ac95",
    name: "YellowPages",
    logoUrl:
      "https://world-id-assets.com/app_148a7f5e6147bb572b4153fdb012ac95/0756e3cc-1d6e-4155-b3ce-ccdefab51872.png",
  },
  {
    appId: "app_fcc649404ebe858f0e95cf53a800ec3e",
    name: "Quotient",
    logoUrl:
      "https://world-id-assets.com/app_fcc649404ebe858f0e95cf53a800ec3e/61df54a5-bfe2-4f74-8bdb-1a4e40d066ce.png",
  },
  {
    appId: "app_dce93ead2038e006e233aa7e385b058b",
    name: "PERSIAN WORLD",
    logoUrl:
      "https://world-id-assets.com/app_dce93ead2038e006e233aa7e385b058b/3801c134-06ea-41c9-9829-39f9185e4a0f.png",
  },
  {
    appId: "app_951f09dc67aba6a1b80a75c766826265",
    name: "Speed",
    logoUrl:
      "https://world-id-assets.com/app_951f09dc67aba6a1b80a75c766826265/e5ccdfad-76f4-4d86-9886-5b39d4048997.png",
  },
  {
    appId: "app_dfc669c2d550539684fd02b0205a11cd",
    name: "Ground Truth",
    logoUrl:
      "https://world-id-assets.com/app_dfc669c2d550539684fd02b0205a11cd/a9f4b3b4-692a-4d88-b5e9-e00a1b326076.png",
  },
  {
    appId: "app_d3e5db57dc4dcaaa5c37bf40fdf34cf5",
    name: "Mood Map",
    logoUrl:
      "https://world-id-assets.com/app_d3e5db57dc4dcaaa5c37bf40fdf34cf5/57da55b5-85fd-4f9f-9d78-421310b50965.png",
  },
  {
    appId: "app_484c58cf4dcee3390120c4486b0175d1",
    name: "Tile Connect",
    logoUrl:
      "https://world-id-assets.com/app_484c58cf4dcee3390120c4486b0175d1/cb643a2e-881c-498f-a3fe-2dfb4af58eef.jpg",
  },
  {
    appId: "app_3a608c523fbf1f651aab7cdfe05fdcd2",
    name: "Wild Arena",
    logoUrl:
      "https://world-id-assets.com/app_3a608c523fbf1f651aab7cdfe05fdcd2/48c867f9-50e8-4b4a-9831-62e34e06e620.jpg",
  },
  {
    appId: "app_ec2000ce524828839d1f54500898f605",
    name: "Climb or Die",
    logoUrl:
      "https://world-id-assets.com/app_ec2000ce524828839d1f54500898f605/08538944-3ff9-43dc-89b8-0187524a0b2c.png",
  },
  {
    appId: "app_55a7a0c600b7d6db18a6ffca8ab3025f",
    name: "Sylva",
    logoUrl:
      "https://world-id-assets.com/app_55a7a0c600b7d6db18a6ffca8ab3025f/9688d4fd-d4aa-497e-b283-2b3fe758909c.png",
  },
  {
    appId: "app_16f3abcf66381a57c3981b34bfba3475",
    name: "MAScope",
    logoUrl:
      "https://world-id-assets.com/app_16f3abcf66381a57c3981b34bfba3475/ebd4f3e8-84d9-48d0-86ac-34c4807f2d4c.png",
  },
  {
    appId: "app_0813025e0ff37e12341879a18a5fbfad",
    name: "Billiards 8Ball Pool",
    logoUrl:
      "https://world-id-assets.com/app_0813025e0ff37e12341879a18a5fbfad/add497f2-07ee-4ec5-9711-c0e14fead443.png",
  },
  {
    appId: "app_f984c2b350037cc3c929d7a4c55c2284",
    name: "Solaris Fall",
    logoUrl:
      "https://world-id-assets.com/app_f984c2b350037cc3c929d7a4c55c2284/289cd0e2-3336-45e3-81e7-7251266799f5.jpg",
  },
  {
    appId: "app_b8f298baa638de78feb5bd678456ecd1",
    name: "Bubble Game Universe",
    logoUrl:
      "https://world-id-assets.com/app_b8f298baa638de78feb5bd678456ecd1/cdfdde31-6c41-43fc-9cb3-c575c6452d6c.png",
  },
  {
    appId: "app_582acdebfc405fa33600fdbe2876e8d6",
    name: "Talk",
    logoUrl:
      "https://world-id-assets.com/app_582acdebfc405fa33600fdbe2876e8d6/03422ff0-4b08-4398-8d61-a29038698d9a.jpg",
  },
  {
    appId: "app_4ebe141030b45a3faad6e6ae603ef34c",
    name: "2048 Blitz",
    logoUrl:
      "https://world-id-assets.com/app_4ebe141030b45a3faad6e6ae603ef34c/65e5a8f9-178c-4598-9c27-33e544d622c3.png",
  },
  {
    appId: "app_6ec7c98b2ec170b27000f7ba79b3925a",
    name: "Aeros",
    logoUrl:
      "https://world-id-assets.com/app_6ec7c98b2ec170b27000f7ba79b3925a/479bc56b-5686-4ae6-b5b4-85c1e1ba5559.png",
  },
  {
    appId: "app_bc257338fa8779bcddca7bc843e08b28",
    name: "Bando",
    logoUrl:
      "https://world-id-assets.com/app_bc257338fa8779bcddca7bc843e08b28/3ed94f51-819c-4648-8217-e15bba8e99c4.png",
  },
  {
    appId: "app_bdbf545af5342ac07c62a8ae0612b02a",
    name: "Speedverse",
    logoUrl:
      "https://world-id-assets.com/app_bdbf545af5342ac07c62a8ae0612b02a/70365e5d-42b1-4611-96c8-c58b3dcd01a7.png",
  },
  {
    appId: "app_feda072081e6469221123592c2c396cc",
    name: "CrazyFootball Game",
    logoUrl:
      "https://world-id-assets.com/app_feda072081e6469221123592c2c396cc/ab6aaeaa-8bf9-4787-af58-2ab6e71b4999.png",
  },
  {
    appId: "app_3e8dea27d858dbee6e2eddadb7f46e1d",
    name: "ZoltX The Crypto Fortune Oracle",
    logoUrl:
      "https://world-id-assets.com/app_3e8dea27d858dbee6e2eddadb7f46e1d/b4e6fcda-ef09-4302-8161-a8cf96b1b15d.jpg",
  },
  {
    appId: "app_77ac4e63ed9854023ea7d2e32759144a",
    name: "Sudoku Stake",
    logoUrl:
      "https://world-id-assets.com/app_77ac4e63ed9854023ea7d2e32759144a/ca44dde2-1b5b-4ee3-9039-6e097282e8a7.png",
  },
  {
    appId: "app_21a06578fdf1eb96343f1335e7a8cf30",
    name: "8Ball Pool",
    logoUrl:
      "https://world-id-assets.com/app_21a06578fdf1eb96343f1335e7a8cf30/b7ed1ee1-bb77-4105-b015-e51cc3c47ee1.png",
  },
  {
    appId: "app_52cf7ffcf91b0c55fb32bb5fbc3750f8",
    name: "Chiptune Generator",
    logoUrl:
      "https://world-id-assets.com/app_52cf7ffcf91b0c55fb32bb5fbc3750f8/858c4fef-f989-40f7-8ee2-e65ec8e8b496.png",
  },
  {
    appId: "app_7efd4cc7832ec839f38a6d1a5592c986",
    name: "InfoJob",
    logoUrl:
      "https://world-id-assets.com/app_7efd4cc7832ec839f38a6d1a5592c986/2cca760a-0a0e-4432-a35f-cb4c4c03c633.png",
  },
  {
    appId: "app_d5f1d33d9525f334fe7fcdff598ed9d5",
    name: "Post Chain",
    logoUrl:
      "https://world-id-assets.com/app_d5f1d33d9525f334fe7fcdff598ed9d5/a20b8813-f95f-4ade-afb4-4e04e579670a.png",
  },
  {
    appId: "app_18b67160a89b048138a06984561af29d",
    name: "Grow Ville",
    logoUrl:
      "https://world-id-assets.com/app_18b67160a89b048138a06984561af29d/d5a56bc0-f15e-447e-bbbd-4dcbf5688b96.png",
  },
  {
    appId: "app_d24c381c204ee4c57845e96bb2ceb58d",
    name: "Local Deals",
    logoUrl:
      "https://world-id-assets.com/app_d24c381c204ee4c57845e96bb2ceb58d/444a964c-ba95-457b-be6e-5d6352fb821d.png",
  },
  {
    appId: "app_e2c444008e11759e9e221c89d9775901",
    name: "Word Solitaire",
    logoUrl:
      "https://world-id-assets.com/app_e2c444008e11759e9e221c89d9775901/3be9ec89-6e91-4373-b1d5-2ca887c38c16.png",
  },
  {
    appId: "app_913ed3343767517eb61e64e277e7f4bc",
    name: "Math",
    logoUrl:
      "https://world-id-assets.com/app_913ed3343767517eb61e64e277e7f4bc/6f78b4fd-80cf-46bd-99ab-53a843c0f311.png",
  },
  {
    appId: "app_9ddf420a5cbce3334cc6813eb4b4d7a1",
    name: "Lumina",
    logoUrl:
      "https://world-id-assets.com/app_9ddf420a5cbce3334cc6813eb4b4d7a1/cb293df8-995e-47eb-a3b6-4e3fc6926eb2.png",
  },
  {
    appId: "app_b360eee7823f6c3e30c5ff991a938db2",
    name: "Log Drop",
    logoUrl:
      "https://world-id-assets.com/app_b360eee7823f6c3e30c5ff991a938db2/eac9deb3-f626-44ae-a253-1e4cf90e074b.jpg",
  },
  {
    appId: "app_05fca0edf875828db56041782109cf94",
    name: "Soonpay",
    logoUrl:
      "https://world-id-assets.com/app_05fca0edf875828db56041782109cf94/79df02bf-a4ea-41b8-9788-ee93f3010f4b.png",
  },
  {
    appId: "app_fbd9616688a837e5cd6070553b5dec8f",
    name: "SDC City",
    logoUrl:
      "https://world-id-assets.com/app_fbd9616688a837e5cd6070553b5dec8f/e9121a81-be8a-43b4-bb28-3938b78c168a.png",
  },
  {
    appId: "app_46c016bda0631e0c464451ea36d125d2",
    name: "AIR FORCE STRIKE",
    logoUrl:
      "https://world-id-assets.com/app_46c016bda0631e0c464451ea36d125d2/510caa14-705c-4341-a7af-cc02f9509ad9.png",
  },
  {
    appId: "app_05321d72a85ff66981429c46e8de7960",
    name: "What is a Crypto",
    logoUrl:
      "https://world-id-assets.com/app_05321d72a85ff66981429c46e8de7960/c90105e4-4a33-4760-8334-e306b9852bf4.png",
  },
  {
    appId: "app_bea5660a2f89839998bc36b6f287a1d4",
    name: "Last Key",
    logoUrl:
      "https://world-id-assets.com/app_bea5660a2f89839998bc36b6f287a1d4/cd503002-f41d-4bdb-a872-6a6ed2d8a1ff.png",
  },
  {
    appId: "app_617ef2f6fb474c662b85e2deccf8373c",
    name: "DoorTap",
    logoUrl:
      "https://world-id-assets.com/app_617ef2f6fb474c662b85e2deccf8373c/048f8029-6cc8-4e27-ae2d-3c5f333bc286.png",
  },
  {
    appId: "app_9f9dbbb575ffa3cfb1f82a8913c4479f",
    name: "ShopHub",
    logoUrl:
      "https://world-id-assets.com/app_9f9dbbb575ffa3cfb1f82a8913c4479f/77843247-2e19-489c-a809-0e0a88b2339f.png",
  },
  {
    appId: "app_e072c7e193c50b5c29078a70e667867d",
    name: "ARYA",
    logoUrl:
      "https://world-id-assets.com/app_e072c7e193c50b5c29078a70e667867d/f9bf7e90-027c-4dc2-801f-6d5ef36e66cc.jpg",
  },
  {
    appId: "app_bfc3261816aeadc589f9c6f80a98f5df",
    name: "HumanBond",
    logoUrl:
      "https://world-id-assets.com/app_bfc3261816aeadc589f9c6f80a98f5df/961c14e8-4d9d-4934-8d73-ebf13f3a7359.png",
  },
  {
    appId: "app_c91f5ccedbb7e1eb29da00f3558fc153",
    name: "WFUND",
    logoUrl:
      "https://world-id-assets.com/app_c91f5ccedbb7e1eb29da00f3558fc153/9c204bc6-f8bc-4994-86e7-6567abe6ba61.png",
  },
  {
    appId: "app_3de6f71dad131f720a81d6b31956ba6e",
    name: "Galaxy Assault",
    logoUrl:
      "https://world-id-assets.com/app_3de6f71dad131f720a81d6b31956ba6e/f6f81551-8bab-4634-8255-dcc1845ded11.png",
  },
  {
    appId: "app_d379930df2539fbce7d456853bb80136",
    name: "Founderz.life",
    logoUrl:
      "https://world-id-assets.com/app_d379930df2539fbce7d456853bb80136/cacf869d-fb9d-419d-ab0b-f147517395b5.png",
  },
  {
    appId: "app_7c0503ccdc9da03e6771242e22ac76d1",
    name: "Relay Favour",
    logoUrl:
      "https://world-id-assets.com/app_7c0503ccdc9da03e6771242e22ac76d1/171a4cde-52c0-4849-a006-dd994cd2f8a9.png",
  },
  {
    appId: "app_73d83736f81fcc516cd3441124414adb",
    name: "TRJ Games",
    logoUrl:
      "https://world-id-assets.com/app_73d83736f81fcc516cd3441124414adb/811e294c-f275-45cf-84f4-f4332c801fb8.png",
  },
  {
    appId: "app_52f5e5248bf24d1b8b45d775d4388199",
    name: "Tolka",
    logoUrl:
      "https://world-id-assets.com/app_52f5e5248bf24d1b8b45d775d4388199/c46dbe15-ca48-44d0-aa1d-d2e41716e441.png",
  },
  {
    appId: "app_b2b02507619e6cef1ac0f54b7b6f0805",
    name: "Scam Check",
    logoUrl:
      "https://world-id-assets.com/app_b2b02507619e6cef1ac0f54b7b6f0805/4f12a1d1-7b07-4848-aafa-ae743a79adad.jpg",
  },
  {
    appId: "app_6f9d7b35c03591b6965c6e47497a8bcd",
    name: "TucuWallet",
    logoUrl:
      "https://world-id-assets.com/app_6f9d7b35c03591b6965c6e47497a8bcd/bbba3fb9-1874-4164-b1a6-eccf41a9eda5.jpg",
  },
  {
    appId: "app_12032a7bcffb03ce0e511e0b09e52ca5",
    name: "The Startup Game",
    logoUrl:
      "https://world-id-assets.com/app_12032a7bcffb03ce0e511e0b09e52ca5/91596e58-2512-4fc1-8ca9-0e4525a733e1.jpg",
  },
  {
    appId: "app_36ca6305c5939aa567b0d42e43475a2b",
    name: "Cat Fighter",
    logoUrl:
      "https://world-id-assets.com/app_36ca6305c5939aa567b0d42e43475a2b/af8c3574-5655-4318-af59-ef4c21bacb99.png",
  },
  {
    appId: "app_03e7bd0ee4091bb677444b35410a0220",
    name: "TBOO",
    logoUrl:
      "https://world-id-assets.com/app_03e7bd0ee4091bb677444b35410a0220/9ee1e375-bd37-46b3-a9de-22f295f4ebdb.png",
  },
  {
    appId: "app_8cfacfdd18980aa0376d5ad7363144cf",
    name: "Trampoline",
    logoUrl:
      "https://world-id-assets.com/app_8cfacfdd18980aa0376d5ad7363144cf/9529a552-8c37-4d70-be09-536063797b29.png",
  },
  {
    appId: "app_c223728f049eaaf844bf4107ae81b808",
    name: "Cardify: Personalized AI Cards",
    logoUrl:
      "https://world-id-assets.com/app_c223728f049eaaf844bf4107ae81b808/d5b7012a-952a-49ac-b27d-dd63695cb8fb.png",
  },
  {
    appId: "app_1638d9fd041c1b178c29ed0b940873bd",
    name: "ImHuman",
    logoUrl:
      "https://world-id-assets.com/app_1638d9fd041c1b178c29ed0b940873bd/c7021384-94cc-4329-a845-6a119927480b.png",
  },
  {
    appId: "app_f0bf3ef645d80f53bcc45097daaae598",
    name: "Pinball Space Adventure",
    logoUrl:
      "https://world-id-assets.com/app_f0bf3ef645d80f53bcc45097daaae598/c3ef4821-3530-4062-bda8-3cdf8688b4a0.png",
  },
  {
    appId: "app_7d4938c2d87f537bd06df9c3ebe10d07",
    name: "HumaGig",
    logoUrl:
      "https://world-id-assets.com/app_7d4938c2d87f537bd06df9c3ebe10d07/bf975ef9-80fc-4a1a-8577-f0328962a7e0.jpg",
  },
  {
    appId: "app_dd1c58193bd1fc126884291c0c83433d",
    name: "FAT SOCCER",
    logoUrl:
      "https://world-id-assets.com/app_dd1c58193bd1fc126884291c0c83433d/ec94792d-d6b8-471c-b6b9-c1dd37cb25f6.png",
  },
  {
    appId: "app_be50be72114b4758d4cbc0d2fce3aafa",
    name: "Flappy UFO ",
    logoUrl:
      "https://world-id-assets.com/app_be50be72114b4758d4cbc0d2fce3aafa/655dbc43-dfe9-4cac-945d-33d9c685b490.jpg",
  },
  {
    appId: "app_0b88e0119b720fd77f81a0499708a6f4",
    name: "Swift Replies",
    logoUrl:
      "https://world-id-assets.com/app_0b88e0119b720fd77f81a0499708a6f4/2d5a754d-7dcc-41aa-b5a6-5a33e7aa1b4e.png",
  },
  {
    appId: "app_d8d62f88301b0234f0a1a91938a68442",
    name: "Proof of Age",
    logoUrl:
      "https://world-id-assets.com/app_d8d62f88301b0234f0a1a91938a68442/567da02c-c925-436f-b096-40a615f424d7.png",
  },
  {
    appId: "app_388c0da67f2137629c52da19b125c6e0",
    name: "Cookie Factory",
    logoUrl:
      "https://world-id-assets.com/app_388c0da67f2137629c52da19b125c6e0/41cf9c5a-fc61-40af-ad3d-0bffdea4816b.png",
  },
  {
    appId: "app_5594dc8a7f477cc4dc243324bc4c3b39",
    name: "Neurodex",
    logoUrl:
      "https://world-id-assets.com/app_5594dc8a7f477cc4dc243324bc4c3b39/0ba3037b-c96c-40ce-9785-2188d7d2ffb3.png",
  },
  {
    appId: "app_47e9a1db6cc2c96858ae2af7c43bee5f",
    name: "Crypto News 24/7",
    logoUrl:
      "https://world-id-assets.com/app_47e9a1db6cc2c96858ae2af7c43bee5f/63ac4887-6e50-443f-9621-3b57665f28e3.png",
  },
  {
    appId: "app_a62f4e58ce6463f49146a1e1669a1541",
    name: "CTS",
    logoUrl:
      "https://world-id-assets.com/app_a62f4e58ce6463f49146a1e1669a1541/b31df23c-a15f-4518-b529-464c82fb7f72.png",
  },
  {
    appId: "app_8e0c90c45143ac9485a8395323c2da95",
    name: "ZeroBot",
    logoUrl:
      "https://world-id-assets.com/app_8e0c90c45143ac9485a8395323c2da95/882c0052-eab4-4299-95a1-7bd567fc7939.png",
  },
  {
    appId: "app_8726a581fc5141a9410361800937fc67",
    name: "Stocks: buy OpenAI, Tesla & more",
    logoUrl:
      "https://world-id-assets.com/app_8726a581fc5141a9410361800937fc67/82367a3c-da8f-403f-b4fb-213c6750a57f.png",
  },
  {
    appId: "app_a12b4ac2a1a13f427a2301e5a2349714",
    name: "Mantica",
    logoUrl:
      "https://world-id-assets.com/app_a12b4ac2a1a13f427a2301e5a2349714/e4c4bc44-ee31-4811-a1a0-66862c5cb627.png",
  },
  {
    appId: "app_9e9064374661498f960754eef48e04af",
    name: "Museum",
    logoUrl:
      "https://world-id-assets.com/app_9e9064374661498f960754eef48e04af/d5efc3a5-8bc0-4ad5-bb4d-02c2e0942b2c.png",
  },
  {
    appId: "app_058f4aaee7f34c11280befcf1166e486",
    name: "Cyclea",
    logoUrl:
      "https://world-id-assets.com/app_058f4aaee7f34c11280befcf1166e486/f5892009-d56a-4ad7-b5b7-4b96cad4aed9.jpg",
  },
  {
    appId: "app_874f13ffc56c1ec67d6051e8f864fdb2",
    name: "Wake up brain",
    logoUrl:
      "https://world-id-assets.com/app_874f13ffc56c1ec67d6051e8f864fdb2/9c2915d8-2382-4395-82da-7804a1ea1840.png",
  },
  {
    appId: "app_99dd5ab218a25a90a04a08f2c61b1cf5",
    name: "Breath",
    logoUrl:
      "https://world-id-assets.com/app_99dd5ab218a25a90a04a08f2c61b1cf5/95439f11-5c5f-41e4-ad02-30cbee7e843c.jpg",
  },
  {
    appId: "app_3bf259f4dd8a4f891d90bf157d401d5b",
    name: "ID PROTOCOL",
    logoUrl:
      "https://world-id-assets.com/app_3bf259f4dd8a4f891d90bf157d401d5b/49629686-86b4-4bf9-8001-233465a4361d.png",
  },
  {
    appId: "app_769b6898d5276f5c95bfc864eff5df5c",
    name: "Pryv",
    logoUrl:
      "https://world-id-assets.com/app_769b6898d5276f5c95bfc864eff5df5c/fe9fb046-78cc-4517-b6f1-788324e9b5d2.png",
  },
  {
    appId: "app_ae63d983edfef3c81d041e03bdcbeef8",
    name: "Japanese Warrior",
    logoUrl:
      "https://world-id-assets.com/app_ae63d983edfef3c81d041e03bdcbeef8/a3e0d6c5-bd06-4b40-9810-6eff214bf468.jpg",
  },
  {
    appId: "app_b98d5dc8d12fdf69ee5184cc13be45a7",
    name: "Basketball Machine",
    logoUrl:
      "https://world-id-assets.com/app_b98d5dc8d12fdf69ee5184cc13be45a7/c41361ec-14de-431c-ad25-fb79210bdd08.png",
  },
  {
    appId: "app_2e3b2e6fa6345c3cb03f3ab9b5a889cb",
    name: "TXT",
    logoUrl:
      "https://world-id-assets.com/app_2e3b2e6fa6345c3cb03f3ab9b5a889cb/02e55841-2a10-4961-85d5-9ac3f2687aba.png",
  },
  {
    appId: "app_aaf6c9d67b93ffe3cc7a2e8692e4c9aa",
    name: "Bird Up",
    logoUrl:
      "https://world-id-assets.com/app_aaf6c9d67b93ffe3cc7a2e8692e4c9aa/f9403f67-bb37-4566-b628-aebd473e1605.png",
  },
  {
    appId: "app_6fd1b46bc9ec25badc53f257c9b0a20a",
    name: "HEDLES",
    logoUrl:
      "https://world-id-assets.com/app_6fd1b46bc9ec25badc53f257c9b0a20a/9cc4616f-dea9-4844-b62e-b4265e7f648f.png",
  },
  {
    appId: "app_1e6440b61b565b94add03056cf8d8985",
    name: "Relaxy",
    logoUrl:
      "https://world-id-assets.com/app_1e6440b61b565b94add03056cf8d8985/4ceca14d-7182-4af2-9dcb-60297073ad4d.png",
  },
  {
    appId: "app_8d2a11165a4fcc30dee0f0686f6b7a67",
    name: "Harbinger Signal",
    logoUrl:
      "https://world-id-assets.com/app_8d2a11165a4fcc30dee0f0686f6b7a67/bcf2c492-5e17-4c88-8ca5-9a0abf991d9b.png",
  },
  {
    appId: "app_569ab3f529677e5b31ad608f39ceb6c6",
    name: "Nest Savings",
    logoUrl:
      "https://world-id-assets.com/app_569ab3f529677e5b31ad608f39ceb6c6/a48ec4ed-44fb-4b91-a50a-55713e56d359.png",
  },
  {
    appId: "app_012da8087715aa8df3e4f9b4b45237e9",
    name: "Hash Humanity",
    logoUrl:
      "https://world-id-assets.com/app_012da8087715aa8df3e4f9b4b45237e9/da78f622-5c2f-42f0-83e0-12cae8feefc8.png",
  },
  {
    appId: "app_bd09b808d0a6bb565bac7b87033d5967",
    name: "Cannon Clash",
    logoUrl:
      "https://world-id-assets.com/app_bd09b808d0a6bb565bac7b87033d5967/5ce35487-34ae-436f-a898-6b7f85ef685e.png",
  },
  {
    appId: "app_b47c517ebdca71a811b311d0e87a66e9",
    name: "RobotMotion",
    logoUrl:
      "https://world-id-assets.com/app_b47c517ebdca71a811b311d0e87a66e9/4db23e37-46b8-44d6-a917-ca42b216796e.png",
  },
  {
    appId: "app_bd797952695360f451aa185586067a54",
    name: "Ninja",
    logoUrl:
      "https://world-id-assets.com/app_bd797952695360f451aa185586067a54/d52d13f2-4417-48d6-8591-aa1e4e54a547.jpg",
  },
  {
    appId: "app_8bd61e592d1a18fa34ac3f7ff63097e1",
    name: "Quip by 1RPC.ai",
    logoUrl:
      "https://world-id-assets.com/app_8bd61e592d1a18fa34ac3f7ff63097e1/ad9316c4-c63b-4256-a179-9bc87f103352.png",
  },
  {
    appId: "app_ca769e635d0463e37af20c72dd339f57",
    name: "Flicko",
    logoUrl:
      "https://world-id-assets.com/app_ca769e635d0463e37af20c72dd339f57/94753400-69aa-4ef6-8364-519b8b3e43ab.jpg",
  },
  {
    appId: "app_bb4349fc1961ab97f73624b4adde4d3c",
    name: "Driver skill",
    logoUrl:
      "https://world-id-assets.com/app_bb4349fc1961ab97f73624b4adde4d3c/44c00711-fbd4-4b82-9e05-bf51e9fa7417.jpg",
  },
  {
    appId: "app_04ba1dd90e224e53a6918da085fa6921",
    name: "Halliday Payments Onramp",
    logoUrl:
      "https://world-id-assets.com/app_04ba1dd90e224e53a6918da085fa6921/147778d9-9b0e-4316-86c7-c8ad5c2ca402.png",
  },
  {
    appId: "app_cc342830aa354c936ec0b5aa4f2fe460",
    name: "TickBoy Forex Arena",
    logoUrl:
      "https://world-id-assets.com/app_cc342830aa354c936ec0b5aa4f2fe460/6584c785-2706-43f3-94f2-ac71f8ff53e0.png",
  },
  {
    appId: "app_2a8550fc883e0a26423ed00ba8827bb2",
    name: "Survival",
    logoUrl:
      "https://world-id-assets.com/app_2a8550fc883e0a26423ed00ba8827bb2/6415d9e9-0897-4297-bffe-69c359a7294b.jpg",
  },
  {
    appId: "app_704158ba273b5153e554bb752f722c81",
    name: "Clock",
    logoUrl:
      "https://world-id-assets.com/app_704158ba273b5153e554bb752f722c81/d2f57351-1686-4c74-b824-a673f84976eb.png",
  },
  {
    appId: "app_da6e51f35c223215245a496dfaba6b22",
    name: "Bricketmon",
    logoUrl:
      "https://world-id-assets.com/app_da6e51f35c223215245a496dfaba6b22/e767b75b-e8b3-473e-b638-661cb7f412b3.jpg",
  },
  {
    appId: "app_4b1f8ec9cfcbe12cfe15223a98479ff7",
    name: "GaiaLink",
    logoUrl:
      "https://world-id-assets.com/app_4b1f8ec9cfcbe12cfe15223a98479ff7/077a777c-9072-4e2f-8960-817a096d93ec.png",
  },
  {
    appId: "app_db7253ac5a8384affe86e5554a602bed",
    name: "Runebound",
    logoUrl:
      "https://world-id-assets.com/app_db7253ac5a8384affe86e5554a602bed/64f65b12-ee8f-4674-beae-6c4f67cca6f9.png",
  },
  {
    appId: "app_4c60855c76b47209cd4de2d0efb22afa",
    name: "16Type",
    logoUrl:
      "https://world-id-assets.com/app_4c60855c76b47209cd4de2d0efb22afa/03e424e3-6fe0-4ee4-897b-1ca918fa858b.png",
  },
  {
    appId: "app_f64186e46eb17d99fdca1ac7804e9466",
    name: "Yoso",
    logoUrl:
      "https://world-id-assets.com/app_f64186e46eb17d99fdca1ac7804e9466/732fe7ff-d020-4cdb-9b91-d525dbb52011.png",
  },
  {
    appId: "app_a960c6a3e7a92f7b6dc8d00b903492c4",
    name: "Atmosphere",
    logoUrl:
      "https://world-id-assets.com/app_a960c6a3e7a92f7b6dc8d00b903492c4/754d5724-36d1-4b35-ae95-0e7f57a3cf64.png",
  },
  {
    appId: "app_c0e13210a41f1135e9b0f0b80930a429",
    name: "Base Block",
    logoUrl:
      "https://world-id-assets.com/app_c0e13210a41f1135e9b0f0b80930a429/31117bb5-368a-47c5-b288-c16da87ef74b.png",
  },
  {
    appId: "app_584b34096edace24ca70503414dcd783",
    name: "Niyyah",
    logoUrl:
      "https://world-id-assets.com/app_584b34096edace24ca70503414dcd783/60947659-f37f-4e2e-adb4-08de4f472709.jpg",
  },
  {
    appId: "app_e055e55b92bd05cadd95a8e05e2a2010",
    name: "SHNNFT!",
    logoUrl:
      "https://world-id-assets.com/app_e055e55b92bd05cadd95a8e05e2a2010/85cce6a0-4dc1-48f9-91b3-08c097181e19.png",
  },
  {
    appId: "app_df0d83ddbade14cb302b37cdd1ef2e5e",
    name: "Pixel Survivors",
    logoUrl:
      "https://world-id-assets.com/app_df0d83ddbade14cb302b37cdd1ef2e5e/3f373bf9-9078-44ce-85de-c71250a39d75.jpg",
  },
  {
    appId: "app_6f84ed85a2c040ea69dadd3f090921e7",
    name: "Not a Fake Game",
    logoUrl:
      "https://world-id-assets.com/app_6f84ed85a2c040ea69dadd3f090921e7/f9dab3d5-1f37-4ef1-aa2c-f9bd850f420b.png",
  },
  {
    appId: "app_7501435523cb7805cb06ca6918973726",
    name: "Fireside",
    logoUrl:
      "https://world-id-assets.com/app_7501435523cb7805cb06ca6918973726/db2388e1-fab1-410f-a156-5918c9d37dfe.png",
  },
  {
    appId: "app_a26635752ab0782bb9f9e6d5dfb4daac",
    name: "TrainGuardian",
    logoUrl:
      "https://world-id-assets.com/app_a26635752ab0782bb9f9e6d5dfb4daac/caa586ae-023f-4297-a429-08e594737f40.png",
  },
  {
    appId: "app_1ea294fa2f01f7daed668f7e13c6e98a",
    name: "Celai",
    logoUrl:
      "https://world-id-assets.com/app_1ea294fa2f01f7daed668f7e13c6e98a/a55ee040-0c2a-4417-a4e8-54b91abb2073.jpg",
  },
  {
    appId: "app_2247375a423ce6effa54f70b7e22a5fb",
    name: "LocalLingo",
    logoUrl:
      "https://world-id-assets.com/app_2247375a423ce6effa54f70b7e22a5fb/e91bdcbe-44eb-4a66-81dd-63775dc4dbaf.png",
  },
  {
    appId: "app_157c7e12fd3f1fdbaf419035e8f7697c",
    name: "Horoscope ZodiApp",
    logoUrl:
      "https://world-id-assets.com/app_157c7e12fd3f1fdbaf419035e8f7697c/af668ef3-af5e-4e10-8bb8-31dc68853b8b.jpg",
  },
  {
    appId: "app_446b4a61e9a97b99ca15266bb80d465b",
    name: "NautaGotchi",
    logoUrl:
      "https://world-id-assets.com/app_446b4a61e9a97b99ca15266bb80d465b/6f7a41b0-551b-4bb8-9f14-ba6ac1004107.jpg",
  },
  {
    appId: "app_93bea290583aeb0c00966497f14c8da1",
    name: "GastroGrove",
    logoUrl:
      "https://world-id-assets.com/app_93bea290583aeb0c00966497f14c8da1/a4862468-cbe2-46bb-b245-c199108567c1.jpg",
  },
  {
    appId: "app_1b51bcf10b0bb20939b8aebbb1dc4568",
    name: "Impossibl",
    logoUrl:
      "https://world-id-assets.com/app_1b51bcf10b0bb20939b8aebbb1dc4568/64b7194e-7587-421b-8817-03f56eac7ab7.png",
  },
  {
    appId: "app_9b2891fd6d223a79bfad9249973455c1",
    name: "World Frame ",
    logoUrl:
      "https://world-id-assets.com/app_9b2891fd6d223a79bfad9249973455c1/cecb9b09-dd29-4f87-af6e-715d357b942f.jpg",
  },
  {
    appId: "app_1f2084bb3b88111b2dacc8b24a1e1bb4",
    name: "Pay Bitcoin",
    logoUrl:
      "https://world-id-assets.com/app_1f2084bb3b88111b2dacc8b24a1e1bb4/d6e95554-0071-409a-a6cf-ac43fc9e6ad4.png",
  },
  {
    appId: "app_93be3eb078a69cd23d6d656708b15227",
    name: "AI DAC",
    logoUrl:
      "https://world-id-assets.com/app_93be3eb078a69cd23d6d656708b15227/e94ceff3-3504-4275-82f3-50abb0a1b8dc.png",
  },
  {
    appId: "app_3d47c8c476ea2cef7223f5a68bbd0bda",
    name: "Farcanoid",
    logoUrl:
      "https://world-id-assets.com/app_3d47c8c476ea2cef7223f5a68bbd0bda/0ad706a3-57c9-49e1-9539-e9eca7c86ff9.png",
  },
  {
    appId: "app_9018b88572a67d5ce5f6b9561865adc8",
    name: "Which Wins?",
    logoUrl:
      "https://world-id-assets.com/app_9018b88572a67d5ce5f6b9561865adc8/3ff698fa-a681-485b-b421-24bcd2ba3725.jpg",
  },
  {
    appId: "app_7d2f62b2657b2fc48dacee337ba8ded0",
    name: "Social Experiment",
    logoUrl:
      "https://world-id-assets.com/app_7d2f62b2657b2fc48dacee337ba8ded0/9d9c1063-5a58-433a-88e7-fc9cff75f198.png",
  },
  {
    appId: "app_e46be27bec413add7207c6d40b28d906",
    name: "Masil",
    logoUrl:
      "https://world-id-assets.com/app_e46be27bec413add7207c6d40b28d906/b8fa50be-e608-4fb6-b3c6-0b7e208791cf.jpg",
  },
  {
    appId: "app_3a93096ed6e4f35613c5387f47a4266d",
    name: "PomoDuck",
    logoUrl:
      "https://world-id-assets.com/app_3a93096ed6e4f35613c5387f47a4266d/19b9d72f-fc1f-415e-adf3-7a5c331d24cd.png",
  },
  {
    appId: "app_646b8a07eff813c6131058224c194db3",
    name: "ParrotIt",
    logoUrl:
      "https://world-id-assets.com/app_646b8a07eff813c6131058224c194db3/3693835b-7e73-46e9-857f-4a609a83165f.png",
  },
  {
    appId: "app_ed4231f610bc9a68149fafc5ab39bc6c",
    name: "got2eat",
    logoUrl:
      "https://world-id-assets.com/app_ed4231f610bc9a68149fafc5ab39bc6c/001bcf7a-ada6-43c7-81b3-a1413eaacbd1.png",
  },
  {
    appId: "app_ab95dc98b1674561db034b63c1cf1a3c",
    name: "3 Minutes Wordle",
    logoUrl:
      "https://world-id-assets.com/app_ab95dc98b1674561db034b63c1cf1a3c/1cec3c2d-f6d3-436d-ada5-8f11a7a8d75f.jpg",
  },
  {
    appId: "app_a13136423b04187d0af66d74f5dd7eb6",
    name: "Retro Boy",
    logoUrl:
      "https://world-id-assets.com/app_a13136423b04187d0af66d74f5dd7eb6/21fd717e-ca16-41a6-b4e5-98d8461b47b7.jpg",
  },
  {
    appId: "app_8f7ec4a9df24ba37251454106b794161",
    name: "Chess Puzzles",
    logoUrl:
      "https://world-id-assets.com/app_8f7ec4a9df24ba37251454106b794161/18437b7e-fe27-4706-b2ec-dc3b24321fc7.png",
  },
  {
    appId: "app_6f1e3944d6d85fe37275d12eaded2dc0",
    name: "Wealth Journey",
    logoUrl:
      "https://world-id-assets.com/app_6f1e3944d6d85fe37275d12eaded2dc0/07f5e261-6bd1-4110-826f-46dd40851dec.png",
  },
  {
    appId: "app_73ec310dcbdeabc026f31235275bd6bc",
    name: "4 in a Row",
    logoUrl:
      "https://world-id-assets.com/app_73ec310dcbdeabc026f31235275bd6bc/34d9e084-55ae-4b81-91eb-5799d30cf0de.png",
  },
  {
    appId: "app_e2f81cad52882ec57ae77f2250377c4d",
    name: "Xiuxian World",
    logoUrl:
      "https://world-id-assets.com/app_e2f81cad52882ec57ae77f2250377c4d/8cb79baa-4819-4373-b766-1f293d5c31cd.png",
  },
  {
    appId: "app_8d4c76e0cea57e5f01c3c51699b96dac",
    name: "Booztory",
    logoUrl:
      "https://world-id-assets.com/app_8d4c76e0cea57e5f01c3c51699b96dac/b9e3b239-bc15-4252-be83-740add4269df.png",
  },
  {
    appId: "app_c832bd1cc0b9cfec0d768b55e7cd1c8b",
    name: "FlickShare",
    logoUrl:
      "https://world-id-assets.com/app_c832bd1cc0b9cfec0d768b55e7cd1c8b/9110a3aa-a505-4b99-a477-211e7aa95c03.png",
  },
  {
    appId: "app_0e834172186d5d6c83edbaf19efac362",
    name: "Pay QR",
    logoUrl:
      "https://world-id-assets.com/app_0e834172186d5d6c83edbaf19efac362/a22423a3-fddb-4a18-a6fa-0327f5dbb6c7.png",
  },
  {
    appId: "app_5917481b7ae23613b5d8dbc8d569b4fb",
    name: "Edge City Patagonia",
    logoUrl:
      "https://world-id-assets.com/app_5917481b7ae23613b5d8dbc8d569b4fb/0e78fa79-da49-49b2-ab65-0231a7d52268.png",
  },
  {
    appId: "app_939eec7dce1feb800e2c725be74ee818",
    name: "Sense Space",
    logoUrl:
      "https://world-id-assets.com/app_939eec7dce1feb800e2c725be74ee818/fe04c7b3-9fbe-47e1-9b55-c9d207dd89d0.png",
  },
  {
    appId: "app_274491ac311324fc77ada9b487e20ebb",
    name: "Survival vs Zoombies",
    logoUrl:
      "https://world-id-assets.com/app_274491ac311324fc77ada9b487e20ebb/ee4f053d-4640-4f75-880c-e7c214749ce8.jpg",
  },
  {
    appId: "app_fbe843d18bc4676e5576543cc4e5402a",
    name: "Liquid",
    logoUrl:
      "https://world-id-assets.com/app_fbe843d18bc4676e5576543cc4e5402a/665200d5-2c90-4d87-b5bb-84f2c4e01ece.png",
  },
  {
    appId: "app_7e9b5b51963d95905622c7ea397383f5",
    name: "Perfect Circle",
    logoUrl:
      "https://world-id-assets.com/app_7e9b5b51963d95905622c7ea397383f5/85910c2d-ed73-456d-9a52-81db4b911b2a.jpg",
  },
  {
    appId: "app_c6ceb88038b115b21a96ba06b1f99d68",
    name: "CreJoy",
    logoUrl:
      "https://world-id-assets.com/app_c6ceb88038b115b21a96ba06b1f99d68/dda84e7a-3b9f-46ee-aad6-28895726de18.png",
  },
  {
    appId: "app_70ec48b37481ccdd8090109b73826c5a",
    name: "Blastar69: Spaceship War",
    logoUrl:
      "https://world-id-assets.com/app_70ec48b37481ccdd8090109b73826c5a/2f35d701-a4aa-4d25-aec9-fa1c0b447aa6.png",
  },
  {
    appId: "app_7e60435ce14a92c8fe155fa02c07b2f1",
    name: "Innermost ",
    logoUrl:
      "https://world-id-assets.com/app_7e60435ce14a92c8fe155fa02c07b2f1/12fddc44-765c-4b77-b43e-4504caa5d215.png",
  },
  {
    appId: "app_015a87e6106e34f6ab2eef3a1a393f29",
    name: "Hardest Captcha",
    logoUrl:
      "https://world-id-assets.com/app_015a87e6106e34f6ab2eef3a1a393f29/9b011062-b9bf-44e1-8bd4-25628d165895.png",
  },
  {
    appId: "app_da027f122bb67b1b7efb2a255fee8ff9",
    name: "Orbimon Masters",
    logoUrl:
      "https://world-id-assets.com/app_da027f122bb67b1b7efb2a255fee8ff9/a06ae010-de90-45db-a452-b33ac0b066aa.jpg",
  },
  {
    appId: "app_6811ab7004517cd06ae16aeca5c9325a",
    name: "InstaINR",
    logoUrl:
      "https://world-id-assets.com/app_6811ab7004517cd06ae16aeca5c9325a/bbfdc6a8-9da3-4b0b-90e0-74544e11e5e5.png",
  },
  {
    appId: "app_955a40b4f5a5eb6c8e8eeeb3bda19550",
    name: "Interworld",
    logoUrl:
      "https://world-id-assets.com/app_955a40b4f5a5eb6c8e8eeeb3bda19550/b33fd6cf-cd14-4fb6-8e43-80f4426157a9.png",
  },
  {
    appId: "app_07855fce542d1c53e0966ce87cf906b9",
    name: "Grand Mahjong Match",
    logoUrl:
      "https://world-id-assets.com/app_07855fce542d1c53e0966ce87cf906b9/7f9162ea-5120-4034-a44a-bf149960a77c.png",
  },
  {
    appId: "app_0bae6514e68915e6b1f2022277521eeb",
    name: "Crypto Quest",
    logoUrl:
      "https://world-id-assets.com/app_0bae6514e68915e6b1f2022277521eeb/a2535e3b-0508-460b-9c31-b118fd393d1c.jpg",
  },
  {
    appId: "app_67746fab8c9421497fe285af4ec3c183",
    name: "Crypto Mahjong",
    logoUrl:
      "https://world-id-assets.com/app_67746fab8c9421497fe285af4ec3c183/37d5c060-0f70-4cf1-b753-327ec1f2012c.jpg",
  },
  {
    appId: "app_efa163edc925103708c00d10b9619de6",
    name: "Sudoku",
    logoUrl:
      "https://world-id-assets.com/app_efa163edc925103708c00d10b9619de6/f1537952-e7a3-4ef8-834d-3bf77814ef68.jpg",
  },
  {
    appId: "app_d5ae70592e2cc06772fe5b40d8d2f00b",
    name: "AESOPNE",
    logoUrl:
      "https://world-id-assets.com/app_d5ae70592e2cc06772fe5b40d8d2f00b/ef6684f4-fed9-4e47-87a1-2c802812bd10.png",
  },
  {
    appId: "app_9d6845027aa4fea71cb338c8912fe44b",
    name: "Connect Dots",
    logoUrl:
      "https://world-id-assets.com/app_9d6845027aa4fea71cb338c8912fe44b/611b3f07-6a39-4b7d-967a-6665145fe043.png",
  },
  {
    appId: "app_0e04c6ff88afff47111c0c3340ee6b71",
    name: "Another Knife Hit",
    logoUrl:
      "https://world-id-assets.com/app_0e04c6ff88afff47111c0c3340ee6b71/91a73c65-737f-4024-b911-9b18bebd4896.png",
  },
  {
    appId: "app_7709630683b291dac751ba3175d9fbcd",
    name: "Crypto Millionaire",
    logoUrl:
      "https://world-id-assets.com/app_7709630683b291dac751ba3175d9fbcd/c230e1ce-8a41-4ef6-a1fc-47e30e9f0d19.jpg",
  },
  {
    appId: "app_493f293cfe64be55d27dbda534520239",
    name: "SLICE MEME FORGE",
    logoUrl:
      "https://world-id-assets.com/app_493f293cfe64be55d27dbda534520239/9f5b6f50-83dc-4c9e-9946-e14837a08d20.jpg",
  },
  {
    appId: "app_daf1a0c68fde117914fdcc285802cca2",
    name: "HELLO",
    logoUrl:
      "https://world-id-assets.com/app_daf1a0c68fde117914fdcc285802cca2/d5ad5d0b-3e70-4a1c-8830-d19b4faf7f94.png",
  },
  {
    appId: "app_eed2b25bc863c8c0f571b08c850bf47d",
    name: "MysticClash",
    logoUrl:
      "https://world-id-assets.com/app_eed2b25bc863c8c0f571b08c850bf47d/58346025-1c38-4d2a-adb7-f5eb293f902f.jpg",
  },
  {
    appId: "app_f663719395d434393b25c5e292544adf",
    name: "Bird Hunter X",
    logoUrl:
      "https://world-id-assets.com/app_f663719395d434393b25c5e292544adf/bc87ea87-2ed3-419c-ad69-6a2a5fb1a273.jpg",
  },
  {
    appId: "app_76e9177063d4e55ca909ed82ca383b65",
    name: "ONE Letter",
    logoUrl:
      "https://world-id-assets.com/app_76e9177063d4e55ca909ed82ca383b65/01330ef3-7b3d-495d-98f2-bd58da94bf8c.jpg",
  },
  {
    appId: "app_a1cbc4450261ebcbfc204841b1e6cd3c",
    name: "Pikame AI",
    logoUrl:
      "https://world-id-assets.com/app_a1cbc4450261ebcbfc204841b1e6cd3c/06414859-c745-4649-a503-d7fe1b604084.jpg",
  },
  {
    appId: "app_15c50f747adfde018c6aaf81bd42a9bb",
    name: "Fit Quest",
    logoUrl:
      "https://world-id-assets.com/app_15c50f747adfde018c6aaf81bd42a9bb/3e9bda6a-4f6a-4424-87bf-3c751db48bd4.jpg",
  },
  {
    appId: "app_08d1062d227ef0429257106a93f5d407",
    name: "YoursTruly",
    logoUrl:
      "https://world-id-assets.com/app_08d1062d227ef0429257106a93f5d407/31bd0555-bedd-4382-bdf0-d560c0a46222.png",
  },
  {
    appId: "app_c0f0f9852e5769a2fe11bd27225b00bf",
    name: "Scribstack",
    logoUrl:
      "https://world-id-assets.com/app_c0f0f9852e5769a2fe11bd27225b00bf/d57db182-bf36-4930-95e3-d15cf3b902a3.jpg",
  },
  {
    appId: "app_75a47a3f99b9c8c9e47e5d5d392c7ae0",
    name: "VoyageOS",
    logoUrl:
      "https://world-id-assets.com/app_75a47a3f99b9c8c9e47e5d5d392c7ae0/a5becc01-b334-4748-a897-782c1616bfb0.png",
  },
  {
    appId: "app_906f92df11f18349d9e388c8c52c67a3",
    name: "SLICE TCG",
    logoUrl:
      "https://world-id-assets.com/app_906f92df11f18349d9e388c8c52c67a3/831b3b64-ddcd-44f2-a5c0-9ac9856ba94e.jpg",
  },
  {
    appId: "app_5597d2f363d545e8645ebee95ccf60a9",
    name: "Classic Ball",
    logoUrl:
      "https://world-id-assets.com/app_5597d2f363d545e8645ebee95ccf60a9/b49f325f-06e5-4f35-beae-2eb03ed2ca4b.png",
  },
  {
    appId: "app_f29f225a1e19fcb7b082318980825a54",
    name: "Rolu Runner",
    logoUrl:
      "https://world-id-assets.com/app_f29f225a1e19fcb7b082318980825a54/128e23ef-cd97-45dc-939f-5334f3ec0f82.png",
  },
  {
    appId: "app_a566c89a9f57792dffba587a2b4a6fb1",
    name: "Parking Lot",
    logoUrl:
      "https://world-id-assets.com/app_a566c89a9f57792dffba587a2b4a6fb1/943df7e4-61ed-42f3-9ae1-336854516b6b.png",
  },
  {
    appId: "app_7e4ff44522fce2223171fff8783d0de4",
    name: "Trace Link",
    logoUrl:
      "https://world-id-assets.com/app_7e4ff44522fce2223171fff8783d0de4/b8825c81-2c0e-4e80-ad4e-225ca8fe0551.png",
  },
  {
    appId: "app_35e0c040ee5b46439aa0390fd9ac5352",
    name: "Farvault",
    logoUrl:
      "https://world-id-assets.com/app_35e0c040ee5b46439aa0390fd9ac5352/f628d523-87bd-434c-8247-0f0f489606e4.png",
  },
  {
    appId: "app_b895da23ba4b1c28d40d481d97f1d82b",
    name: "Base Guard",
    logoUrl:
      "https://world-id-assets.com/app_b895da23ba4b1c28d40d481d97f1d82b/512a8b19-f3b9-45d3-b39d-d70f4771da57.jpg",
  },
  {
    appId: "app_28f0f1c77a2a9e5e82225d2d7c8f076f",
    name: "DOODROPS",
    logoUrl:
      "https://world-id-assets.com/app_28f0f1c77a2a9e5e82225d2d7c8f076f/1186c683-686e-40ad-9368-1eea4289344b.png",
  },
  {
    appId: "app_754fd6bda46cc1e7349af6673a22377c",
    name: "TFH Town Hall ",
    logoUrl:
      "https://world-id-assets.com/app_754fd6bda46cc1e7349af6673a22377c/d633ee9a-1276-4195-968c-16ab2f76f8f9.png",
  },
  {
    appId: "app_09658875b301cc76bbdf76f7c1d006cc",
    name: "Lockchain",
    logoUrl:
      "https://world-id-assets.com/app_09658875b301cc76bbdf76f7c1d006cc/66a73dac-6310-4141-b712-cef77a6b368f.png",
  },
  {
    appId: "app_8b7d4f6b72b7c73ae063280c645f4700",
    name: "HephAI",
    logoUrl:
      "https://world-id-assets.com/app_8b7d4f6b72b7c73ae063280c645f4700/1ab478f0-7fe2-4d18-a575-fb0b6992b8b4.png",
  },
  {
    appId: "app_b5b31c6d11e562ec7e3607cb3bad4813",
    name: "CAVEMAN: Jump Jump",
    logoUrl:
      "https://world-id-assets.com/app_b5b31c6d11e562ec7e3607cb3bad4813/4e072c6e-9f34-4ece-80f0-9a6d0b2bed7b.png",
  },
  {
    appId: "app_8bc016fd1444688a5112cc3aadee4653",
    name: "AIShi Radio",
    logoUrl:
      "https://world-id-assets.com/app_8bc016fd1444688a5112cc3aadee4653/53b467dd-2645-4b0a-bbf9-8798c6844a92.png",
  },
  {
    appId: "app_7e40b42d836ca03f996d390575951a25",
    name: "FarGuesser",
    logoUrl:
      "https://world-id-assets.com/app_7e40b42d836ca03f996d390575951a25/8b6d0f92-1f7f-434e-a4a0-b3815a92f750.png",
  },
  {
    appId: "app_d1d3c5d8537967f91f4da7b65627610d",
    name: "Frame Pro ",
    logoUrl:
      "https://world-id-assets.com/app_d1d3c5d8537967f91f4da7b65627610d/0dd99353-72ee-4676-8ce6-b930f9bb4abe.jpg",
  },
  {
    appId: "app_388d11760603973537a94de2b2aa1b11",
    name: "FARBURGERS",
    logoUrl:
      "https://world-id-assets.com/app_388d11760603973537a94de2b2aa1b11/3dc1deb4-e469-4944-8edd-79f6aeb97e5e.png",
  },
  {
    appId: "app_d43e6a8ad9a334892ee552eedb62b994",
    name: "ONE Fortune",
    logoUrl:
      "https://world-id-assets.com/app_d43e6a8ad9a334892ee552eedb62b994/d7c473c5-7a7b-443f-a62f-b4acc2939bdf.png",
  },
  {
    appId: "app_71d13c386c8773b371372c0b54924c07",
    name: "Crypto Flap",
    logoUrl:
      "https://world-id-assets.com/app_71d13c386c8773b371372c0b54924c07/8d95852d-e91e-4f3e-9723-32aeb33e1544.png",
  },
  {
    appId: "app_d7d74f7670c9cc36e9bbcc47874c8817",
    name: "SelfBrain",
    logoUrl:
      "https://world-id-assets.com/app_d7d74f7670c9cc36e9bbcc47874c8817/ad2d05bc-58ba-4b2a-aa5f-c718af541c2a.png",
  },
  {
    appId: "app_4d4f45b0562ef3703ec88a300ab2d882",
    name: "Cup Hunt",
    logoUrl:
      "https://world-id-assets.com/app_4d4f45b0562ef3703ec88a300ab2d882/500a6d10-00ab-47c5-b83f-455f5270f371.jpg",
  },
  {
    appId: "app_8a3d5dc854ba8041014638c555b70019",
    name: "Farcade Falls",
    logoUrl:
      "https://world-id-assets.com/app_8a3d5dc854ba8041014638c555b70019/f0d1fe4d-53d5-4ca0-82c7-c2d26cc8098f.png",
  },
  {
    appId: "app_67d01e327e57da7a45d7d2a2fc639268",
    name: "Sea Adventure",
    logoUrl:
      "https://world-id-assets.com/app_67d01e327e57da7a45d7d2a2fc639268/5167000f-0077-4223-8243-8a788c6a2a51.png",
  },
  {
    appId: "app_1050b467bc5509e3ff7377f870f51823",
    name: "Echo Mariner",
    logoUrl:
      "https://world-id-assets.com/app_1050b467bc5509e3ff7377f870f51823/07b0583b-9144-4423-a840-0ff02aac13c6.jpg",
  },
  {
    appId: "app_17d00e5777b081a027b0fd4583a17263",
    name: "Snowy Pop",
    logoUrl:
      "https://world-id-assets.com/app_17d00e5777b081a027b0fd4583a17263/eb07f254-e011-4895-b3ac-e049e2f132ac.png",
  },
  {
    appId: "app_31c5d40c0c968363a4adfb2a622571ed",
    name: "RETRO SNAKE",
    logoUrl:
      "https://world-id-assets.com/app_31c5d40c0c968363a4adfb2a622571ed/9cfa9d6d-1d50-4600-aa0c-d6d4ca850f7b.png",
  },
  {
    appId: "app_0d4ae361c659799fa25020d877a0889f",
    name: "Super Fleet Command",
    logoUrl:
      "https://world-id-assets.com/app_0d4ae361c659799fa25020d877a0889f/46b0311f-49bf-46ec-9faa-f090ca442cde.png",
  },
  {
    appId: "app_0d9239a1ae7ad4008436f3fb133001a4",
    name: "Castle Rescue",
    logoUrl:
      "https://world-id-assets.com/app_0d9239a1ae7ad4008436f3fb133001a4/74875e17-7323-463d-b364-aaf0f60db8c2.jpg",
  },
  {
    appId: "app_bd9617533b02d1d2da211959a9a4dc7a",
    name: "Spot The Ball",
    logoUrl:
      "https://world-id-assets.com/app_bd9617533b02d1d2da211959a9a4dc7a/90c25166-b053-4b99-8d2a-9030e97fcabe.jpg",
  },
  {
    appId: "app_4978464f3b940a6c9028f958b2fafdd8",
    name: "GOBLIN PUSH",
    logoUrl:
      "https://world-id-assets.com/app_4978464f3b940a6c9028f958b2fafdd8/fc6127dd-3f0c-406b-ae8a-fac7c8364854.png",
  },
  {
    appId: "app_18a7624d2af11a2d75e516979f82acc7",
    name: "BizarreBeasts: Head Crush",
    logoUrl:
      "https://world-id-assets.com/app_18a7624d2af11a2d75e516979f82acc7/22255c23-f0cd-4677-80ac-cf335932e868.png",
  },
  {
    appId: "app_c2ea3dfafe5c5abc8cab5e17d7f01228",
    name: "Neon Sneaker",
    logoUrl:
      "https://world-id-assets.com/app_c2ea3dfafe5c5abc8cab5e17d7f01228/64f8ce5f-d5dc-457f-96a1-70c85e80185e.png",
  },
  {
    appId: "app_6e1cbd99d803cb7a064c34eff7755fc9",
    name: "Reaction Poppers",
    logoUrl:
      "https://world-id-assets.com/app_6e1cbd99d803cb7a064c34eff7755fc9/8001145f-58c3-4afe-8a9e-b2c6ec3d0f7b.png",
  },
  {
    appId: "app_93218d9292e14fbd070f40bda7207ca9",
    name: "Forgotten Path",
    logoUrl:
      "https://world-id-assets.com/app_93218d9292e14fbd070f40bda7207ca9/14c55373-4a2f-4421-868a-16627aaf5b66.png",
  },
  {
    appId: "app_afb4f343f2f7e26bc3435dd3f2494842",
    name: "Squad 7",
    logoUrl:
      "https://world-id-assets.com/app_afb4f343f2f7e26bc3435dd3f2494842/7d3ad403-fb22-4ce3-87f3-fbcb068df5f7.png",
  },
  {
    appId: "app_b432e385575d425e1ade32daa3f3a06e",
    name: "Snake",
    logoUrl:
      "https://world-id-assets.com/app_b432e385575d425e1ade32daa3f3a06e/f39b57e6-542b-4f92-b0e6-c23d6b4d7350.png",
  },
  {
    appId: "app_7049a4aad98a19b22d0bf895e7c48bfb",
    name: "DOUBT GAME",
    logoUrl:
      "https://world-id-assets.com/app_7049a4aad98a19b22d0bf895e7c48bfb/07245ad0-8185-411a-aab0-409f15b79e91.jpg",
  },
  {
    appId: "app_146f6153c7f567efcc333a9622f39434",
    name: "Pizza Protocol",
    logoUrl:
      "https://world-id-assets.com/app_146f6153c7f567efcc333a9622f39434/02ddfc5d-99d4-4eaa-a818-089d84ec5cee.jpg",
  },
  {
    appId: "app_4493fbeaa2ea0d6e46e00f3823220856",
    name: "Tap 1 then 2...",
    logoUrl:
      "https://world-id-assets.com/app_4493fbeaa2ea0d6e46e00f3823220856/c2e597b6-b2a7-49c8-a315-7577ef6e86b3.jpg",
  },
  {
    appId: "app_698c91fce209af2aabf7a92425560dd4",
    name: "Treasure Arcade",
    logoUrl:
      "https://world-id-assets.com/app_698c91fce209af2aabf7a92425560dd4/d9de448f-2de1-46f6-aaaf-477194afafa0.jpg",
  },
  {
    appId: "app_597859317cd0be48c5eeafcf7d83d525",
    name: "Draw the Doodles",
    logoUrl:
      "https://world-id-assets.com/app_597859317cd0be48c5eeafcf7d83d525/eb1366bd-0af4-4057-b0fb-3a27087a7fa0.png",
  },
  {
    appId: "app_91190f3689f2d34181e9d8495cfa5523",
    name: "Treasure Quest",
    logoUrl:
      "https://world-id-assets.com/app_91190f3689f2d34181e9d8495cfa5523/4a257d02-6ace-4775-8b49-aeb6733c1d42.png",
  },
  {
    appId: "app_d50721bafc13635f45ac606a0d60f334",
    name: "Allergic Wizard",
    logoUrl:
      "https://world-id-assets.com/app_d50721bafc13635f45ac606a0d60f334/2b7bd6b5-7542-404f-b157-033c3e6bfd90.png",
  },
  {
    appId: "app_b535b95636ebcabd8534376aff9adbe7",
    name: "Think Quick",
    logoUrl:
      "https://world-id-assets.com/app_b535b95636ebcabd8534376aff9adbe7/80866c95-d8db-4d3d-90a5-1ee14c2cbe68.jpg",
  },
  {
    appId: "app_1f05a752e896ed2558125947fe308971",
    name: "COUNTERSPELL",
    logoUrl:
      "https://world-id-assets.com/app_1f05a752e896ed2558125947fe308971/a9930d20-445c-496c-89dd-d15e744d17a5.jpg",
  },
  {
    appId: "app_11cf3b3965d9c8243154cd87750587b5",
    name: "SEA STRIKE: Battleship PvP",
    logoUrl:
      "https://world-id-assets.com/app_11cf3b3965d9c8243154cd87750587b5/31d230f9-8c49-462b-bcca-b051411feec5.png",
  },
  {
    appId: "app_6205b24a7cb61a04d91557fb65d41688",
    name: "Bizarre Bounce",
    logoUrl:
      "https://world-id-assets.com/app_6205b24a7cb61a04d91557fb65d41688/a83796c5-7c55-4d0b-8ff3-7abd2b3f682e.png",
  },
  {
    appId: "app_7747b073b1aa988c8a3df292663e614c",
    name: "BLADE SHIFT",
    logoUrl:
      "https://world-id-assets.com/app_7747b073b1aa988c8a3df292663e614c/bcff80fb-7026-46c7-82c5-1fdebe3a0b58.jpg",
  },
  {
    appId: "app_5c0bee8cbe19b141ae908d23910ab606",
    name: "Far Nouns",
    logoUrl:
      "https://world-id-assets.com/app_5c0bee8cbe19b141ae908d23910ab606/98ed5b42-ec80-4f24-85e1-d97b7fa5578a.png",
  },
  {
    appId: "app_9b0f1e738d5fdac1705849087ee9dcaa",
    name: "OpenSea Battles",
    logoUrl:
      "https://world-id-assets.com/app_9b0f1e738d5fdac1705849087ee9dcaa/62f01b1a-6405-4252-893c-3e792de04a9f.jpg",
  },
  {
    appId: "app_776e7c4ebe1d11890b88d664bf0dc384",
    name: "Brick Breaker",
    logoUrl:
      "https://world-id-assets.com/app_776e7c4ebe1d11890b88d664bf0dc384/87c9eb6c-61e2-421f-8a43-ed834ed7c533.jpg",
  },
  {
    appId: "app_d8f19bf44a2db95fa408f82776065f58",
    name: "SAUSAGE SLOPES",
    logoUrl:
      "https://world-id-assets.com/app_d8f19bf44a2db95fa408f82776065f58/a13d0aa2-04ee-4e16-8b1f-8b2beb710fd0.png",
  },
  {
    appId: "app_afacfe836ae69ceedfefb3e6cb7a7598",
    name: "Grimoire of the Grid",
    logoUrl:
      "https://world-id-assets.com/app_afacfe836ae69ceedfefb3e6cb7a7598/35c3aa44-5fc2-4d32-993c-fcdd117f892e.png",
  },
  {
    appId: "app_e5b65163600b5597fc8c7e1ccf8c94f8",
    name: "HOTSHOT",
    logoUrl:
      "https://world-id-assets.com/app_e5b65163600b5597fc8c7e1ccf8c94f8/c071b9a9-1bd6-4a5b-b19a-fd9412afcdb1.png",
  },
  {
    appId: "app_f23649ff7fc7d773fbee4ab793a60316",
    name: "KAJISULI",
    logoUrl:
      "https://world-id-assets.com/app_f23649ff7fc7d773fbee4ab793a60316/a58123d1-3429-49b7-8b96-2eb61063536e.png",
  },
  {
    appId: "app_f84c5d87b37fa7356b67fdaeff90e073",
    name: "Sourceri",
    logoUrl:
      "https://world-id-assets.com/app_f84c5d87b37fa7356b67fdaeff90e073/275932f9-26f0-412e-af1c-1e8b25634c65.png",
  },
  {
    appId: "app_6db2b2214627c0f730d596003a7f7d58",
    name: "The Matrix Runner",
    logoUrl:
      "https://world-id-assets.com/app_6db2b2214627c0f730d596003a7f7d58/4e3ff718-68a6-4ba3-b2e7-595785f135b4.jpg",
  },
  {
    appId: "app_1ccadda73ac1af761e12a1c32d618101",
    name: "Pengu Catches Fish",
    logoUrl:
      "https://world-id-assets.com/app_1ccadda73ac1af761e12a1c32d618101/c50e7c72-cb27-4955-a167-b68ef60bdaf0.jpg",
  },
  {
    appId: "app_9ae396394f201040d4a461629e108d09",
    name: "Base Tile Rush",
    logoUrl:
      "https://world-id-assets.com/app_9ae396394f201040d4a461629e108d09/75e8c75f-b7a8-4722-8ef9-a2ebb7271266.jpg",
  },
  {
    appId: "app_7215f1309d06c608a1a107da4ba6022e",
    name: "Runes Wayfinder",
    logoUrl:
      "https://world-id-assets.com/app_7215f1309d06c608a1a107da4ba6022e/d6ea5313-2427-4bab-8816-334b06a35bfb.png",
  },
  {
    appId: "app_f6917cf2fcd84910cb5fe1954caa0050",
    name: "Memory",
    logoUrl:
      "https://world-id-assets.com/app_f6917cf2fcd84910cb5fe1954caa0050/fda9b252-e7d8-4538-b205-d31c817fbcc7.jpg",
  },
  {
    appId: "app_f28d68510a1a72b2544c15bc7dece902",
    name: "Minesweeper",
    logoUrl:
      "https://world-id-assets.com/app_f28d68510a1a72b2544c15bc7dece902/c4635039-4fc1-4cca-be46-862e9be72080.png",
  },
  {
    appId: "app_f96208c42abd4b71bef83b7fdfe037cb",
    name: "Table Soccer Heroes",
    logoUrl:
      "https://world-id-assets.com/app_f96208c42abd4b71bef83b7fdfe037cb/5dbc6045-e947-4ff7-95f5-b80cfc256924.jpg",
  },
  {
    appId: "app_018ea92089f48339be0e1885ea23fbed",
    name: "Pixel Road",
    logoUrl:
      "https://world-id-assets.com/app_018ea92089f48339be0e1885ea23fbed/e310366c-56d4-494b-bb50-2451dda9290e.jpg",
  },
  {
    appId: "app_fde1fc719f0475818a6642c876ef2c7b",
    name: "Happy Long Legs",
    logoUrl:
      "https://world-id-assets.com/app_fde1fc719f0475818a6642c876ef2c7b/3d673b70-5d5f-492d-a38c-90f9a0e77194.png",
  },
  {
    appId: "app_b18f6d24715fc1c32e1b0644645d77e8",
    name: "By Order",
    logoUrl:
      "https://world-id-assets.com/app_b18f6d24715fc1c32e1b0644645d77e8/fa193e8f-7e79-43ad-9ba6-e8d64b4f14f5.png",
  },
  {
    appId: "app_ffe2495293fcc8eb4a7fb7ec66a38c78",
    name: "Space Explorer",
    logoUrl:
      "https://world-id-assets.com/app_ffe2495293fcc8eb4a7fb7ec66a38c78/392915d3-ba5b-4c81-a2d5-19257eb8091e.png",
  },
  {
    appId: "app_3a7d1167bf2438f9af8b414b0c25759d",
    name: "BizarreBeasts: TicTacToe",
    logoUrl:
      "https://world-id-assets.com/app_3a7d1167bf2438f9af8b414b0c25759d/a23fec9e-acf5-4423-956e-1e2fa1db1e4d.png",
  },
  {
    appId: "app_d1b9b8703605ad8264401f82046b40d9",
    name: "Rock 'N' Pudgy",
    logoUrl:
      "https://world-id-assets.com/app_d1b9b8703605ad8264401f82046b40d9/b6f34880-a759-4661-9132-35ff7dc3283c.png",
  },
  {
    appId: "app_1b0d957c2cc3035a394b7c3b231a2998",
    name: "Doodles: Pigeon Plunge",
    logoUrl:
      "https://world-id-assets.com/app_1b0d957c2cc3035a394b7c3b231a2998/0eabd3ec-f1f7-4240-b17b-2aa6937b568d.png",
  },
  {
    appId: "app_9b670a3a7a791c19064654f7a1accf7c",
    name: "Pengu's Rocket",
    logoUrl:
      "https://world-id-assets.com/app_9b670a3a7a791c19064654f7a1accf7c/b3dd333a-2572-4717-89fb-d41652ac53e9.png",
  },
  {
    appId: "app_d9b84a049359e03656317f5a866a0a53",
    name: "BizarreBeasts Memory Game",
    logoUrl:
      "https://world-id-assets.com/app_d9b84a049359e03656317f5a866a0a53/a58c9fea-e42d-4a92-b67f-79d890863fcd.png",
  },
  {
    appId: "app_493b65bb823158be6c77a4cfde5e9f93",
    name: "WIZARD DUEL",
    logoUrl:
      "https://world-id-assets.com/app_493b65bb823158be6c77a4cfde5e9f93/895e40c4-fdac-48a8-89d3-3f25248b6f0b.jpg",
  },
  {
    appId: "app_67f9e99252a00a518e437c42aa6d2819",
    name: "BOMBERMIX",
    logoUrl:
      "https://world-id-assets.com/app_67f9e99252a00a518e437c42aa6d2819/7d331b08-7ff0-4150-baf0-30f911583182.jpg",
  },
  {
    appId: "app_48859e97450728991214570644eb4024",
    name: "Duo",
    logoUrl:
      "https://world-id-assets.com/app_48859e97450728991214570644eb4024/a55a2998-3380-44ed-a255-69a4c16d591b.png",
  },
  {
    appId: "app_ed06f94d891564a6bf328bb7542cc2e7",
    name: "Perfect Balance",
    logoUrl:
      "https://world-id-assets.com/app_ed06f94d891564a6bf328bb7542cc2e7/18e3f099-529e-45b5-b4d6-01c3baa8bc5c.png",
  },
  {
    appId: "app_748acaaab2c27a797788c3fdc4428c50",
    name: "lasthumanstanding",
    logoUrl:
      "https://world-id-assets.com/app_748acaaab2c27a797788c3fdc4428c50/72b202a3-da06-4ca0-821a-000239f366c2.jpg",
  },
  {
    appId: "app_6e7d0226e994e4a508a1dcba77a96e14",
    name: "Try Me",
    logoUrl:
      "https://world-id-assets.com/app_6e7d0226e994e4a508a1dcba77a96e14/321d8b75-c5ca-4f33-b4ad-89ad123f581a.png",
  },
  {
    appId: "app_b961d7c3741f5591c3fce3b5bdeeeab2",
    name: "MindFlip: The Memory Match Challenge",
    logoUrl:
      "https://world-id-assets.com/app_b961d7c3741f5591c3fce3b5bdeeeab2/c9e440ea-ce87-4e2e-823a-3ffd345080a4.png",
  },
  {
    appId: "app_729e6957b28ac6e0e1d192d3066f2645",
    name: "BizarreBeasts: Checkerz",
    logoUrl:
      "https://world-id-assets.com/app_729e6957b28ac6e0e1d192d3066f2645/3eda6dc1-f184-4bee-9938-a3f77669627c.png",
  },
  {
    appId: "app_2ce1f296ecca6be8e04a8fdda917bbfb",
    name: "Flapcaster",
    logoUrl:
      "https://world-id-assets.com/app_2ce1f296ecca6be8e04a8fdda917bbfb/628a92dd-03ae-47f6-ba46-4c914a825dd1.png",
  },
  {
    appId: "app_01f767b559f75ba48d3d1d8f14b25e8b",
    name: "Based game",
    logoUrl:
      "https://world-id-assets.com/app_01f767b559f75ba48d3d1d8f14b25e8b/5bf7a2f0-707e-4d0d-b8eb-8f88550aa56d.jpg",
  },
  {
    appId: "app_4b26f385971c035aa33b945f4e1f2b17",
    name: "Park it!",
    logoUrl:
      "https://world-id-assets.com/app_4b26f385971c035aa33b945f4e1f2b17/0b3c542c-b231-4517-baa6-677e2d6aab03.png",
  },
  {
    appId: "app_cf52901a511939a29bf6659af05aaa95",
    name: "Joystance",
    logoUrl:
      "https://world-id-assets.com/app_cf52901a511939a29bf6659af05aaa95/b3644f24-c1b1-48ef-8c55-924dedfb18c6.png",
  },
  {
    appId: "app_192658194cc9d2aeb91f3d7e8c76d647",
    name: "Flappy Nouns",
    logoUrl:
      "https://world-id-assets.com/app_192658194cc9d2aeb91f3d7e8c76d647/4772ee71-1491-4d99-b4e3-25355cfc7e1a.png",
  },
  {
    appId: "app_80d5f0c8ec017b7beee70cc38b730e4b",
    name: "Synapse",
    logoUrl:
      "https://world-id-assets.com/app_80d5f0c8ec017b7beee70cc38b730e4b/7af8c0ec-e517-4678-ac9c-fde88ec5cdf8.png",
  },
  {
    appId: "app_eb372473298c83103a4386e3eaf54a56",
    name: "Pengu: Rescue Mission",
    logoUrl:
      "https://world-id-assets.com/app_eb372473298c83103a4386e3eaf54a56/5adb9719-8bf9-4c18-98ae-18d7c610f9e8.png",
  },
  {
    appId: "app_6e1ff471c89f658eeb1a5a86902baa15",
    name: "Room 21",
    logoUrl:
      "https://world-id-assets.com/app_6e1ff471c89f658eeb1a5a86902baa15/726e7835-0d6b-43c3-a3c5-ee3b63eb90e3.png",
  },
  {
    appId: "app_9f8209d41d053ba62513a3cb366c872f",
    name: "ourwld",
    logoUrl:
      "https://world-id-assets.com/app_9f8209d41d053ba62513a3cb366c872f/3820fe59-227a-45c6-b219-26d378615768.png",
  },
  {
    appId: "app_dc7869b1b8781fb520aa1115685df7a6",
    name: "Before I Come In",
    logoUrl:
      "https://world-id-assets.com/app_dc7869b1b8781fb520aa1115685df7a6/63e433f5-f035-4125-9c97-95e7bff06b3c.png",
  },
  {
    appId: "app_db7a84a7883b84126bc1fc52dd774870",
    name: "SURVIVOR: Island Adventure",
    logoUrl:
      "https://world-id-assets.com/app_db7a84a7883b84126bc1fc52dd774870/0134a44e-57d0-4eae-9aa7-f96c02754721.jpg",
  },
  {
    appId: "app_c9572b113d96a905453fc07b143b24b6",
    name: "chess",
    logoUrl:
      "https://world-id-assets.com/app_c9572b113d96a905453fc07b143b24b6/206b291d-970b-4252-97ae-f9b39ed8f5e9.png",
  },
  {
    appId: "app_68150d8918eb13927e779a770161bc5f",
    name: "TILE MATCH: Fruit Journey",
    logoUrl:
      "https://world-id-assets.com/app_68150d8918eb13927e779a770161bc5f/7e7d922a-794c-497e-860f-b8db37e3eee7.jpg",
  },
  {
    appId: "app_30c7b1a4127cca75b14c1abb6a024d46",
    name: "TuringVote",
    logoUrl:
      "https://world-id-assets.com/app_30c7b1a4127cca75b14c1abb6a024d46/4395947b-42a9-4900-bf69-daab416ce723.png",
  },
  {
    appId: "app_0764c7f57717ba41747472dcccab653b",
    name: "RUMP: The President Run",
    logoUrl:
      "https://world-id-assets.com/app_0764c7f57717ba41747472dcccab653b/21d3f6de-57b1-4778-b23b-5ae7b46c7a2e.png",
  },
  {
    appId: "app_d28adaf29b13cd65e6cd6c6987cbaa4b",
    name: "LUCK: The Game",
    logoUrl:
      "https://world-id-assets.com/app_d28adaf29b13cd65e6cd6c6987cbaa4b/c1ac246b-1ecd-40c4-a6e7-e0350c57cc51.png",
  },
  {
    appId: "app_39ba2bf031c9925d1ba3521a305568d8",
    name: "Blink Battle",
    logoUrl:
      "https://world-id-assets.com/app_39ba2bf031c9925d1ba3521a305568d8/05e1c3ab-ef1a-42cb-a161-40efb4d3dfde.jpg",
  },
  {
    appId: "app_bde87c899c9afe2f83e2f3cf8f3ffed7",
    name: "Lift Off Sneaker Drop",
    logoUrl:
      "https://world-id-assets.com/app_bde87c899c9afe2f83e2f3cf8f3ffed7/292bd1fb-a1a8-43a6-8cca-4c3e7a2d610f.jpg",
  },
  {
    appId: "app_09fd056c17aed2ca3ffc1a72db6095cf",
    name: "BUBBLE MERGE: Physics Puzzle",
    logoUrl:
      "https://world-id-assets.com/app_09fd056c17aed2ca3ffc1a72db6095cf/f48fd622-09db-4795-a080-8b7558c84ad0.jpg",
  },
  {
    appId: "app_79a5969a322ba70ac208ccd4773cb913",
    name: "Orbiter",
    logoUrl:
      "https://world-id-assets.com/app_79a5969a322ba70ac208ccd4773cb913/98b3f6e4-e413-404b-b612-6988d0db1b07.png",
  },
  {
    appId: "app_8029ca365b8a05759fcf36ad0af0e85e",
    name: "OlaGG Store ",
    logoUrl:
      "https://world-id-assets.com/app_8029ca365b8a05759fcf36ad0af0e85e/87db0dc4-c600-4e73-8192-a4bec4cfea5d.png",
  },
  {
    appId: "app_8759766ce92173ee6e1ce6568a9bc9e6",
    name: "CarParKing",
    logoUrl:
      "https://world-id-assets.com/app_8759766ce92173ee6e1ce6568a9bc9e6/dac6f1e8-ddb8-41b9-8e27-1870e9737d0e.jpg",
  },
  {
    appId: "app_22e37965c741ea54632a2b5c4a1931d2",
    name: "SUPER BOUNCE",
    logoUrl:
      "https://world-id-assets.com/app_22e37965c741ea54632a2b5c4a1931d2/69afea40-3511-4483-8d07-983e38092255.jpg",
  },
  {
    appId: "app_735233cb2ab90811e1adf0be438e34c2",
    name: "Lines",
    logoUrl:
      "https://world-id-assets.com/app_735233cb2ab90811e1adf0be438e34c2/ea87d4a1-8746-4b6b-8728-0499eba02c84.png",
  },
  {
    appId: "app_f80dbc395ac1628524e8e32ceeeaff39",
    name: "No Bot Shop",
    logoUrl:
      "https://world-id-assets.com/app_f80dbc395ac1628524e8e32ceeeaff39/4c5eb3fa-faf3-465a-ad2c-d84d521403e6.png",
  },
  {
    appId: "app_013c9d2e9589f177cf6c250bc6cf92d9",
    name: "Weapons Tycoon",
    logoUrl:
      "https://world-id-assets.com/app_013c9d2e9589f177cf6c250bc6cf92d9/514f9c82-b5e5-4efb-b5aa-2d499cfd80ff.jpg",
  },
  {
    appId: "app_9d90745d27b06e9528ce204f7bb3193a",
    name: "Marketplace",
    logoUrl:
      "https://world-id-assets.com/app_9d90745d27b06e9528ce204f7bb3193a/d5bd3028-c049-4dd8-bc36-d073f1c1a60a.jpg",
  },
  {
    appId: "app_0b5f36ba9fafb5b1a6a0a476a44e431f",
    name: "Zconnect",
    logoUrl:
      "https://world-id-assets.com/app_0b5f36ba9fafb5b1a6a0a476a44e431f/74e07dfc-61b8-459c-b48f-a9e7e9159453.png",
  },
  {
    appId: "app_4928b6aa9b79370c1d3854d4458afb64",
    name: "DroneWatch",
    logoUrl:
      "https://world-id-assets.com/app_4928b6aa9b79370c1d3854d4458afb64/225f6ab6-977e-4148-baae-9926177d0c41.jpg",
  },
  {
    appId: "app_3d2700b59db3188917a65335289cd3d6",
    name: "Bamboozl3d",
    logoUrl:
      "https://world-id-assets.com/app_3d2700b59db3188917a65335289cd3d6/28a8c616-4ad6-424a-95ab-b7f81a2d0d93.png",
  },
  {
    appId: "app_523161caed2be4409652bbfc86bd27e5",
    name: "VEHICLE FACTORY",
    logoUrl:
      "https://world-id-assets.com/app_523161caed2be4409652bbfc86bd27e5/38a68ba2-8e8c-47fa-a7f3-ff7e4bb39030.jpg",
  },
  {
    appId: "app_edda8a25850f92b242540e3c675a491f",
    name: "Orbit Lock",
    logoUrl:
      "https://world-id-assets.com/app_edda8a25850f92b242540e3c675a491f/a0783039-7e4b-4ec5-82bc-cb47c4c0dc28.png",
  },
  {
    appId: "app_9b17a90f67cc4ecc9df21a4037c8412c",
    name: "Insurance",
    logoUrl:
      "https://world-id-assets.com/app_9b17a90f67cc4ecc9df21a4037c8412c/66b1b3e2-2cb4-4897-9043-7a70f6d7fd15.png",
  },
  {
    appId: "app_432275aa9cdf0f795465b4038052010f",
    name: "Roboto",
    logoUrl:
      "https://world-id-assets.com/app_432275aa9cdf0f795465b4038052010f/ad26cb88-15d5-41c2-a835-2dbf6b2e4c3b.png",
  },
  {
    appId: "app_b51b29f3430ade0379a91fdbc3017a69",
    name: "CYBER SPACE",
    logoUrl:
      "https://world-id-assets.com/app_b51b29f3430ade0379a91fdbc3017a69/8e8660b5-74eb-450c-bded-f4cb44234578.png",
  },
  {
    appId: "app_bffbe7bdfc0c5c6323d637dad82d4c37",
    name: "PIXZILLA: King of Monsters",
    logoUrl:
      "https://world-id-assets.com/app_bffbe7bdfc0c5c6323d637dad82d4c37/a09a7f60-b309-4275-932c-9c34631837f0.png",
  },
  {
    appId: "app_dc0f20f6ead0f6a3207e167a88f09db4",
    name: "Gravity Grab",
    logoUrl:
      "https://world-id-assets.com/app_dc0f20f6ead0f6a3207e167a88f09db4/46e1d85f-c68e-4081-946a-3245cc3f52f1.png",
  },
  {
    appId: "app_856c6fd121de780631041e183a6f9753",
    name: "Hachi",
    logoUrl:
      "https://world-id-assets.com/app_856c6fd121de780631041e183a6f9753/5b3bcd61-1fb3-46b6-9f09-1fde20bcbd44.png",
  },
  {
    appId: "app_6abd52c9b57257d84c8bf19d6286aeef",
    name: "Localey ",
    logoUrl:
      "https://world-id-assets.com/app_6abd52c9b57257d84c8bf19d6286aeef/1b15b027-0de4-485d-a58e-1cd6ddcfaf44.jpg",
  },
  {
    appId: "app_3e02969e1cf9223af433acb3d78410d8",
    name: "Onboard",
    logoUrl:
      "https://world-id-assets.com/app_3e02969e1cf9223af433acb3d78410d8/7be587fd-34e2-4f57-b4d8-a669c150214d.png",
  },
  {
    appId: "app_ab66bcfb37bb72f68653677b60187d36",
    name: "Goods Sort Master",
    logoUrl:
      "https://world-id-assets.com/app_ab66bcfb37bb72f68653677b60187d36/3dd3d230-9f8d-4af2-9178-e705cd681cc8.jpg",
  },
  {
    appId: "app_e01c784079f6a00c3fe7310881f02625",
    name: "Sand Drop",
    logoUrl:
      "https://world-id-assets.com/app_e01c784079f6a00c3fe7310881f02625/18a02521-9cd6-48b7-9327-c826ee9c6249.jpg",
  },
  {
    appId: "app_db7f3c33881d081cb95d3193b6a14135",
    name: "Bamboozled",
    logoUrl:
      "https://world-id-assets.com/app_db7f3c33881d081cb95d3193b6a14135/8c9ffe98-d8d0-4800-b319-43dc64a82347.png",
  },
  {
    appId: "app_d8635e9ce8aa3188821440f213ca9d73",
    name: "Arrow Out",
    logoUrl:
      "https://world-id-assets.com/app_d8635e9ce8aa3188821440f213ca9d73/ec6d68e6-1ae4-4253-a597-9d055513b3ad.jpg",
  },
  {
    appId: "app_d3fd866b85880e2e024da13e65e91cf7",
    name: "Checkpoint",
    logoUrl:
      "https://world-id-assets.com/app_d3fd866b85880e2e024da13e65e91cf7/181444e2-ff6a-404e-a632-1739e741c0c1.png",
  },
  {
    appId: "app_cdc7b097b7841d7877794c4939b55ebc",
    name: "Gomoku",
    logoUrl:
      "https://world-id-assets.com/app_cdc7b097b7841d7877794c4939b55ebc/ffa9ed1d-3af6-479b-a9bf-d4f67739de21.png",
  },
  {
    appId: "app_0cef418d9147e3594a9b3640ba385466",
    name: "TicTacToe",
    logoUrl:
      "https://world-id-assets.com/app_0cef418d9147e3594a9b3640ba385466/970c293c-2224-4604-86a1-45c4f135f426.png",
  },
  {
    appId: "app_3b463a83cfeb960f193cf96f9339d22d",
    name: "Skill Cup",
    logoUrl:
      "https://world-id-assets.com/app_3b463a83cfeb960f193cf96f9339d22d/48764fd6-9983-4a74-81e3-81632fedeaa9.jpg",
  },
  {
    appId: "network",
    name: "Network",
    logoUrl:
      "https://world-id-assets.com/app_a23c6398432498825962a9b96294dde1/3877f653-da15-4903-99ee-7bfef1538172.png",
  },
  {
    appId: "invites",
    name: "Invites",
    logoUrl:
      "https://world-id-assets.com/app_432af83feb4051e72fd7ee682f365c39/226637ea-b16d-4bb3-9ae0-c9b4eaf7ef07.png",
  },
  {
    appId: "app_e8288209fbe1fc4a1b80619e925a79bd",
    name: "Learn",
    logoUrl:
      "https://world-id-assets.com/app_e8288209fbe1fc4a1b80619e925a79bd/42c87046-76c7-427a-9783-3e9f23e3a47e.png",
  },
];

// Parallel to CELLS in ./index.tsx - one APPS index per cell.
export const CELL_APP_INDICES: readonly number[] = [
  197, 396, 467, 9, 178, 531, 449, 107, 538, 423, 224, 60, 42, 412, 190, 395,
  346, 104, 209, 135, 240, 470, 1, 268, 292, 368, 309, 28, 356, 452, 446, 365,
  231, 332, 492, 387, 44, 270, 85, 79, 383, 364, 11, 108, 345, 513, 145, 382,
  237, 234, 485, 202, 277, 110, 345, 205, 330, 502, 199, 147, 429, 129, 272,
  490, 65, 478, 138, 419, 4, 92, 76, 98, 358, 229, 166, 335, 447, 509, 472, 181,
  527, 170, 57, 389, 294, 267, 152, 150, 448, 360, 77, 357, 328, 217, 489, 277,
  146, 57, 384, 67, 340, 294, 235, 425, 23, 156, 120, 122, 13, 118, 442, 325,
  534, 50, 491, 476, 404, 522, 232, 303, 440, 47, 482, 504, 121, 36, 187, 238,
  230, 376, 74, 133, 282, 77, 507, 228, 448, 297, 70, 351, 31, 249, 486, 334,
  287, 510, 155, 474, 79, 184, 469, 156, 2, 516, 4, 208, 97, 10, 27, 457, 375,
  213, 163, 428, 274, 435, 319, 157, 316, 117, 223, 113, 241, 168, 135, 415,
  543, 37, 475, 88, 361, 331, 255, 58, 310, 277, 216, 366, 113, 455, 37, 129,
  269, 488, 407, 248, 480, 526, 237, 229, 223, 109, 286, 46, 420, 30, 321, 514,
  413, 546, 283, 512, 176, 318, 357, 64, 258, 5, 347, 179, 532, 509, 211, 250,
  380, 414, 87, 181, 49, 409, 226, 152, 487, 433, 378, 115, 252, 406, 162, 547,
  15, 451, 371, 311, 8, 18, 388, 196, 515, 131, 340, 86, 105, 393, 377, 381,
  257, 181, 12, 313, 319, 342, 74, 295, 519, 524, 99, 368, 445, 212, 251, 93,
  478, 193, 69, 212, 5, 367, 78, 252, 99, 370, 9, 93, 246, 513, 320, 0, 126,
  363, 379, 133, 281, 290, 40, 438, 369, 285, 174, 501, 495, 262, 268, 543, 19,
  142, 119, 45, 353, 193, 133, 43, 468, 91, 191, 171, 308, 349, 241, 38, 203,
  297, 491, 216, 97, 410, 506, 83, 197, 439, 378, 484, 126, 471, 84, 144, 168,
  153, 231, 82, 243, 456, 296, 482, 437, 372, 239, 335, 377, 164, 112, 324, 363,
  81, 201, 447, 372, 325, 551, 80, 350, 218, 179, 401, 445, 359, 380, 57, 450,
  12, 25, 303, 374, 66, 154, 394, 307, 210, 208, 498, 233, 361, 172, 63, 324,
  225, 265, 80, 115, 375, 263, 387, 206, 236, 75, 41, 358, 43, 157, 504, 67, 46,
  136, 259, 145, 187, 397, 22, 497, 102, 233, 29, 185, 96, 34, 458, 240, 254,
  480, 177, 386, 468, 148, 426, 56, 512, 143, 339, 439, 47, 310, 279, 459, 498,
  391, 109, 347, 188, 452, 53, 65, 435, 175, 530, 23, 314, 376, 40, 89, 16, 24,
  204, 432, 260, 76, 137, 112, 206, 132, 105, 396, 218, 352, 32, 236, 465, 508,
  220, 419, 491, 125, 551, 72, 15, 540, 174, 275, 293, 287, 205, 102, 140, 501,
  512, 426, 292, 518, 269, 550, 81, 499, 423, 503, 82, 182, 332, 134, 107, 404,
  48, 342, 287, 325, 306, 53, 62, 138, 298, 427, 447, 549, 368, 306, 17, 448,
  103, 92, 425, 22, 177, 209, 288, 527, 344, 418, 472, 114, 14, 219, 228, 145,
  427, 44, 458, 356, 150, 126, 408, 281, 194, 493, 486, 50, 403, 330, 315, 432,
  182, 130, 541, 377, 462, 73, 388, 41, 517, 518, 422, 188, 431, 140, 91, 24,
  434, 99, 398, 153, 36, 333, 417, 349, 436, 85, 371, 222, 456, 394, 310, 390,
  446, 247, 270, 529, 472, 300, 444, 424, 487, 1, 375, 27, 158, 428, 166, 131,
  195, 280, 53, 439, 315, 154, 516, 291, 492, 130, 536, 341, 284, 442, 298, 120,
  259, 352, 535, 60, 535, 159, 322, 269, 32, 203, 18, 397, 72, 421, 0, 494, 361,
  530, 317, 309, 222, 2, 302, 411, 296, 272, 327, 465, 542, 215, 118, 264, 333,
  547, 463, 41, 332, 405, 122, 229, 414, 523, 534, 78, 301, 539, 521, 460, 523,
  29, 166, 469, 35, 532, 116, 374, 475, 180, 339, 336, 420, 500, 379, 250, 16,
  520, 147, 34, 489, 356, 548, 442, 104, 227, 402, 165, 417, 203, 291, 430, 273,
  100, 462, 519, 405, 39, 286, 470, 28, 434, 541, 201, 376, 327, 459, 34, 293,
  11, 366, 117, 144, 183, 127, 88, 534, 246, 291, 182, 147, 311, 109, 86, 528,
  49, 194, 552, 415, 308, 531, 340, 305, 94, 123, 232, 235, 265, 186, 2, 45,
  422, 235, 437, 304, 535, 353, 5, 549, 149, 128, 78, 407, 537, 529, 173, 514,
  531, 533, 415, 326, 318, 329, 519, 508, 96, 49, 3, 313, 172, 39, 89, 94, 363,
  318, 284, 346, 386, 186, 479, 195, 113, 180, 454, 214, 541, 4, 522, 438, 424,
  324, 178, 345, 288, 107, 59, 400, 328, 429, 191, 394, 464, 545, 460, 367, 505,
  146, 200, 10, 285, 193, 409, 33, 279, 214, 308, 457, 185, 222, 69, 517, 477,
  9, 359, 402, 525, 155, 106, 33, 87, 131, 414, 303, 544, 526, 249, 120, 16,
  421, 225, 100, 28, 461, 545, 167, 302, 136, 385, 134, 292, 339, 384, 549, 513,
  13, 30, 444, 520, 423, 496, 195, 25, 208, 171, 354, 477, 328, 117, 343, 388,
  64, 207, 425, 248, 405, 475, 403, 490, 548, 21, 510, 484, 539, 62, 483, 199,
  499, 189, 488, 101, 202, 55, 151, 410, 259, 354, 515, 431, 73, 238, 38, 286,
  63, 201, 471, 495, 108, 450, 299, 346, 321, 12, 224, 36, 399, 348, 453, 207,
  173, 517, 369, 105, 454, 304, 451, 295, 60, 205, 276, 230, 71, 184, 336, 391,
  61, 112, 296, 234, 221, 118, 153, 56, 501, 165, 285, 511, 75, 221, 132, 473,
  70, 320, 395, 390, 236, 51, 39, 26, 160, 529, 260, 233, 307, 297, 408, 540,
  142, 413, 492, 183, 412, 314, 258, 98, 81, 523, 443, 373, 158, 101, 336, 143,
  159, 187, 225, 152, 111, 210, 21, 494, 329, 33, 111, 6, 532, 76, 278, 65, 270,
  319, 487, 476, 314, 213, 86, 58, 176, 282, 349, 71, 409, 66, 445, 327, 315,
  502, 146, 467, 151, 479, 301, 323, 360, 470, 70, 219, 544, 24, 545, 411, 408,
  299, 100, 242, 483, 47, 110, 196, 252, 468, 124, 218, 174, 42, 160, 326, 266,
  125, 430, 262, 505, 175, 289, 391, 178, 378, 79, 255, 334, 496, 268, 10, 275,
  198, 26, 302, 497, 242, 0, 15, 538, 295, 355, 149, 247, 466, 224, 383, 74,
  546, 254, 11, 163, 460, 110, 473, 522, 509, 383, 61, 42, 123, 19, 198, 19,
  141, 400, 93, 367, 226, 23, 194, 419, 441, 220, 102, 481, 450, 278, 395, 116,
  162, 365, 82, 504, 402, 52, 142, 280, 353, 189, 246, 382, 242, 55, 185, 434,
  317, 525, 192, 484, 300, 416, 337, 256, 421, 528, 192, 167, 192, 249, 451,
  170, 411, 369, 163, 464, 219, 94, 267, 48, 240, 211, 127, 453, 256, 198, 26,
  148, 95, 343, 7, 197, 115, 114, 396, 169, 106, 59, 209, 18, 280, 430, 274,
  413, 392, 330, 393, 443, 169, 300, 469, 281, 88, 139, 165, 321, 90, 91, 533,
  61, 196, 528, 283, 466, 40, 149, 399, 206, 158, 301, 179, 486, 48, 137, 538,
  139, 444, 143, 508, 261, 83, 467, 230, 289, 180, 418, 457, 154, 215, 258, 253,
  329, 385, 267, 284, 355, 476, 68, 337, 473, 516, 279, 362, 274, 443, 189, 92,
  526, 483, 304, 231, 550, 213, 401, 537, 422, 389, 191, 410, 204, 406, 312,
  510, 54, 461, 251, 323, 351, 455, 393, 168, 372, 374, 228, 272, 183, 90, 50,
  392, 190, 103, 380, 309, 347, 137, 322, 364, 175, 148, 244, 305, 371, 276,
  283, 215, 461, 326, 481, 265, 214, 503, 364, 51, 485, 125, 97, 226, 119, 141,
  104, 537, 389, 536, 129, 551, 521, 247, 514, 496, 322, 348, 502, 481, 331, 7,
  427, 161, 542, 106, 299, 294, 275, 437, 533, 172, 220, 381, 338, 202, 43, 511,
  159, 75, 497, 477, 474, 500, 35, 495, 435, 547, 518, 334, 436, 17, 199, 416,
  6, 505, 261, 355, 344, 463, 227, 404, 55, 362, 68, 243, 539, 493, 290, 14, 8,
  253, 466, 264, 103, 98, 471, 190, 169, 101, 96, 173, 73, 160, 338, 548, 288,
  221, 348, 22, 29, 392, 398, 263, 121, 248, 237, 384, 271, 52, 141, 254, 261,
  64, 207, 385, 164, 482, 429, 480, 542, 406, 312, 311, 216, 398, 27, 266, 217,
  89, 90, 244, 433, 46, 162, 400, 521, 83, 407, 260, 424, 386, 87, 44, 150, 412,
  379, 128, 85, 68, 114, 498, 80, 337, 515, 323, 238, 530, 151, 210, 17, 140,
  485, 161, 20, 54, 305, 449, 459, 256, 257, 45, 171, 338, 360, 204, 506, 239,
  263, 128, 241, 66, 217, 540, 124, 431, 520, 3, 289, 390, 108, 313, 358, 489,
  381, 56, 344, 479, 138, 266, 13, 262, 212, 335, 464, 511, 227, 245, 462, 25,
  306, 186, 122, 507, 144, 341, 273, 525, 271, 436, 67, 111, 438, 290, 524, 387,
  30, 139, 366, 417, 21, 54, 200, 350, 452, 20, 244, 251, 494, 426, 373, 119,
  449, 72, 20, 552, 77, 490, 458, 298, 441, 546, 474, 550, 134, 488, 365, 382,
  58, 257, 223, 95, 232, 7, 282, 503, 342, 453, 116, 32, 370, 418, 211, 3, 524,
  320, 316, 343, 245, 463, 373, 527, 370, 135, 250, 156, 37, 507, 278, 38, 333,
  403, 164, 273, 316, 440, 493, 271, 359, 441, 69, 362, 59, 432, 31, 95, 357,
  84, 31, 440, 6, 123, 188, 176, 543, 200, 341, 130, 276, 161, 456, 552, 136,
  71, 155, 167, 454, 331, 307, 428, 1, 506, 416, 399, 62, 446, 455, 350, 245, 8,
  351, 264, 293, 317, 63, 51, 239, 420, 352, 52, 132, 499, 465, 124, 500, 433,
  35, 234, 84, 184, 177, 157,
];

// Drop-in for the `ICON_SOURCES` the prototype's getPlaceholderIconHref comment
// describes: same length and order as CELLS.
export const ICON_SOURCES: readonly string[] = CELL_APP_INDICES.map(
  (index) => APPS[index].logoUrl,
);
