// services/encryptionService.js
const crypto = require('crypto');

class EncryptionService {
  constructor() {
    // Store key in environment variable or AWS KMS, HashiCorp Vault
    this.algorithm = 'aes-256-gcm';
    this.key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    console.log(iv)
    
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    encrypted = ('$' + encrypted + '$' + iv.toString('hex')+ '$' + authTag.toString('hex'));
    console.log(encrypted);
    
    
    return encrypted
  }

  decrypt(encryptedData) {
    const [fspare, data, hexstring, authtag] = encryptedData.split("$");
    const iv = Buffer.from(hexstring, 'hex');
    const authTag = Buffer.from(authtag, 'hex');
    console.log(authtag)

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    console.log(decrypted)
    
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

module.exports = new EncryptionService();