from Crypto.Cipher import AES
import base64
import os

key_hex = os.getenv("ENCRYPTION_KEY")

def decrypt_aes_gcm(encoded):
    key = bytes.fromhex(key_hex)
    data = base64.b64decode(encoded)
    iv = data[:12]
    ciphertext = data[12:-16]
    tag = data[-16:]

    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    decrypted = cipher.decrypt_and_verify(ciphertext, tag)
    return decrypted.decode()
