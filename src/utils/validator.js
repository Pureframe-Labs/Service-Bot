const Joi = require('joi');

const schemas = {
  webhookPayload: Joi.object({
    object: Joi.string().valid('whatsapp_business_account').required(),
    entry: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        changes: Joi.array().items(
          Joi.object({
            value: Joi.object({
              messaging_product: Joi.string().valid('whatsapp').required(),
              metadata: Joi.object({
                display_phone_number: Joi.string().required(),
                phone_number_id: Joi.string().required(),
              }).required(),
              contacts: Joi.array().items(
                Joi.object({
                  profile: Joi.object({
                    name: Joi.string(),
                  }),
                  wa_id: Joi.string().required(),
                })
              ),
              messages: Joi.array().items(
                Joi.object({
                  from: Joi.string().required(),
                  id: Joi.string().required(),
                  timestamp: Joi.string().required(),
                  type: Joi.string().required(),
                  interactive: Joi.object({
                    type: Joi.string().valid('button_reply', 'flow_reply'),
                    button_reply: Joi.object({
                      id: Joi.string().required(),
                      title: Joi.string().required(),
                    }),
                    flow_reply: Joi.object({
                      flow_token: Joi.string().required(),
                    }),
                  }),
                  button: Joi.object({
                    text: Joi.string().required(),
                    payload: Joi.string().required(),
                  }),
                  text: Joi.object({
                    body: Joi.string().required(),
                  }),
                })
              ),
            }).required(),
          })
        ),
      })
    ),
  }),
  
  paymentWebhook: Joi.object({
    event: Joi.string().required(),
    payload: Joi.object({
      payment: Joi.object({
        entity: Joi.object({
          id: Joi.string().required(),
          order_id: Joi.string().required(),
          status: Joi.string().required(),
          amount: Joi.number().required(),
          currency: Joi.string().required(),
        }).required(),
      }).required(),
    }).required(),
  }),
};

const validate = (schema, data) => {
  const { error } = schema.validate(data);
  if (error) {
    throw new Error(error.details[0].message);
  }
  return true;
};

module.exports = { schemas, validate };
