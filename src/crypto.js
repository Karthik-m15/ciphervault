// Native Web Crypto API Helper for Zero-Knowledge Encryption

export async function deriveKey(masterPassword, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(masterPassword),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptData(plaintext, masterPassword, saltArray = null) {
  const salt = saltArray ? new Uint8Array(saltArray) : window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(masterPassword, salt);

  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoded
  );

  return {
    ciphertext: Array.from(new Uint8Array(ciphertext)),
    salt: Array.from(salt),
    iv: Array.from(iv)
  };
}

export async function decryptData(encryptedObj, masterPassword) {
  try {
    const salt = new Uint8Array(encryptedObj.salt);
    const iv = new Uint8Array(encryptedObj.iv);
    const ciphertext = new Uint8Array(encryptedObj.ciphertext);
    const key = await deriveKey(masterPassword, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    throw new Error("Invalid Master Password or Corrupted Vault Data.");
  }
}