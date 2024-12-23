export async function generateChannelKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-CBC", // Algorithm
      length: 256, // Key length (256 bits)
    },
    true, // Extractable (true if you need to export it later)
    ["encrypt", "decrypt"], // Usages
  );
  return await crypto.subtle.exportKey("jwk", key);
}
