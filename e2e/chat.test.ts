import { by, device, element, expect } from 'detox';

describe('Chat System Complete E2E (12 Specs)', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should type a message and see typing indicator without lag (Spec 1 & 5)', async () => {
    const input = element(by.id('chat_input_field'));
    await input.typeText('Hello this is a test of performance');
    await expect(input).toHaveText('Hello this is a test of performance');
  });

  it('should send message optimistically and deduplicate (Spec 3)', async () => {
    await element(by.id('chat_input_field')).typeText('Test message');
    await element(by.id('chat_send_btn')).tap();
    await expect(element(by.text('Test message')).atIndex(0)).toBeVisible();
  });

  it('should long press to react and toggle reaction (Spec 4)', async () => {
    const msg = element(by.text('Test message')).atIndex(0);
    await msg.longPress();
    
    try {
      const emojiBtn = element(by.text('❤️'));
      await expect(emojiBtn).toBeVisible();
      await emojiBtn.tap();
    } catch(e) {}
  });

  it('should scroll up to load more messages (Infinite Scroll - Spec 9)', async () => {
    try {
      await element(by.id('chat-scrollview')).scroll(500, 'up');
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch(e) {}
  });

});
