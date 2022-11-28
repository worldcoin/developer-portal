const argon2 = require("argon2");
const crypto = require("crypto");

const randomNumber = () => {
  return Math.floor(
    Math.random() * (99999999999 - 10000000000 + 1) + 10000000000
  );
};

const salt = Buffer.from("CvQeBdrHKhFHoY3E4HLb4SqJu5KfjUHE3M4Wpvn4");

async function genNullifier(number) {
  const argon2hash = await argon2.hash(`wid_sample_action_id_${number}`, {
    timeCost: 36, // Number of iterations
    salt,
  });

  // SHA256 the output (consistent hash, friendly encoding, hide the salt)
  const sha256Hash = crypto.createHash("sha256");
  sha256Hash.update(argon2hash);
  return sha256Hash.digest("hex");
}

async function main() {
  const times = [];
  for (let i = 0; i < 10; i++) {
    const phoneNumber = randomNumber();
    const startTime = new Date().getTime();
    await genNullifier(`+${phoneNumber}`);
    times.push(new Date().getTime() - startTime);
    console.log(i);
  }

  const avgTime = times.reduce((acc, val) => (acc ?? 0) + val) / times.length;
  console.log(`Average time for 1 hash: ${avgTime} ms.`);

  // Assuming 9 bytes of entropy (removes country code, and conservatively some numbers that can be excluded)
  // NOTE: This is non-parallel execution
  const daysToBreak = (avgTime / 1000 / 60 / 60 / 24) * 10 ** 9;
  console.log(
    `Days to compute entire rainbow table knowing the salt: ${Math.floor(
      daysToBreak
    )} (${daysToBreak / 365} years)`
  );
}

main();
