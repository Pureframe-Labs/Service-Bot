const helpers = {
  generateOrderId: () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ORD${timestamp}${random}`.toUpperCase();
  },

  formatPhoneNumber: (phone) => {
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Ensure it starts with country code
    if (cleaned.startsWith('0')) {
      return `91${cleaned.substring(1)}`;
    }
    
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    
    return cleaned;
  },

  parseUserInfo: (text) => {
    const parts = text.split(',').map(part => part.trim());
    
    if (parts.length >= 6) {
      return {
        name: parts[0],
        email: parts[1],
        state: parts[2],
        district: parts[3],
        village: parts[4],
        surveyNumber: parts[5],
        extra: parts.slice(6)
      };
    }
    
    return null;
  }
};

module.exports = helpers;
