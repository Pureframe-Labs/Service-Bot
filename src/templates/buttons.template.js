const createQuickReplyButtons = (buttons) => {
  return {
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: 'Please select an option:',
      },
      action: {
        buttons: buttons.map(button => ({
          type: 'reply',
          reply: {
            id: button.id,
            title: button.title,
          },
        })),
      },
    },
  };
};

const yesNoButtons = () => {
  return createQuickReplyButtons([
    { id: 'yes', title: 'Yes' },
    { id: 'no', title: 'No' },
  ]);
};

module.exports = { createQuickReplyButtons, yesNoButtons };
