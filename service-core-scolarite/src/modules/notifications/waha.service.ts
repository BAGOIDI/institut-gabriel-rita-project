import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WahaService {
  private readonly logger = new Logger(WahaService.name);
  private readonly wahaApiUrl = process.env.WAHA_API_URL || 'http://localhost:3000';

  async sendWhatsAppMessage(phone: string, message: string) {
    try {
      // Format phone number for WAHA (e.g., 2376XXXXXXX@c.us)
      const chatId = `${phone}@c.us`;
      await axios.post(`${this.wahaApiUrl}/api/sendText`, {
        chatId: chatId,
        text: message,
        session: 'default'
      });
      this.logger.log(`WhatsApp message sent to ${phone}`);
    } catch (error) {
      this.logger.error(`Failed to send WA message to ${phone}`, error.message);
    }
  }
}
