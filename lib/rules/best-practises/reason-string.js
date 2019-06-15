const _ = require('lodash')
const BaseChecker = require('./../base-checker')

const DEFAULT_MAX_CHARACTERS_LONG = 20

const ruleId = 'reason-string'
const meta = {
  type: 'best-practises',

  docs: {
    description:
      'Require or revert statement must have a reason string and check that each reason string is at most N characters long.',
    category: 'Best Practise Rules'
  },

  isDefault: false,
  recommended: false,
  defaultSetup: ['warn', { maxLength: DEFAULT_MAX_CHARACTERS_LONG }],

  schema: [
    {
      type: 'array',
      items: [
        {
          properties: {
            maxLength: {
              type: 'string'
            }
          },
          additionalProperties: false
        }
      ],
      uniqueItems: true,
      minItems: 2
    }
  ]
}

class ReasonStringChecker extends BaseChecker {
  constructor(reporter, config) {
    super(reporter, ruleId, meta)

    this.maxCharactersLong =
      (config &&
        config.getObjectPropertyNumber(ruleId, 'maxLength', DEFAULT_MAX_CHARACTERS_LONG)) ||
      DEFAULT_MAX_CHARACTERS_LONG
  }

  enterFunctionCallArguments(ctx) {
    if (this.isReasonStringStatement(ctx)) {
      const functionParameters = this.getFunctionParameters(ctx)
      const functionName = this.getFunctionName(ctx)

      const lastFunctionParameter = _.last(functionParameters)

      const haveReasonMessage = this.haveReasonMessage(lastFunctionParameter)
      const haveNoMessage = functionParameters.length <= 1 || !haveReasonMessage
      if (haveNoMessage) {
        this._errorHaveNoMessage(ctx, functionName)
      } else if (haveReasonMessage) {
        const lastParameterWithoutQuotes = lastFunctionParameter.replace(/['"]+/g, '')
        if (lastParameterWithoutQuotes.length > this.maxCharactersLong) {
          this._errorMessageIsTooLong(ctx, functionName)
        }
      }
    }
  }

  isReasonStringStatement(ctx) {
    const name = this.getFunctionName(ctx)
    return _.includes(['revert', 'require'], name)
  }

  getFunctionName(ctx) {
    const parent = ctx.parentCtx
    const { 0: name } = parent.children
    return name.getText()
  }

  getFunctionParameters(ctx) {
    const parent = ctx.parentCtx
    const { 2: nodes } = parent.children
    const childs = nodes.children[0].children
    const parameters = childs.filter(value => value.getText() !== ',').map(value => value.getText())
    return parameters
  }

  haveReasonMessage(str) {
    return str.indexOf("'") >= 0 || str.indexOf('"') >= 0
  }

  _errorHaveNoMessage(ctx, key) {
    this.error(ctx, `Provide an error message for ${key}`)
  }

  _errorMessageIsTooLong(ctx, key) {
    this.error(ctx, `Error message for ${key} is too long`)
  }
}

module.exports = ReasonStringChecker