// .eslint-local-rules.js
export default {
  'no-direct-localstorage': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow direct localStorage usage, use StorageManager instead',
      },
      messages: {
        noDirectLocalStorage: 'Use StorageManager instead of direct localStorage access',
      },
    },
    create(context) {
      return {
        MemberExpression(node) {
          if (
            node.object.name === 'localStorage' &&
            ['getItem', 'setItem', 'removeItem', 'clear'].includes(node.property.name)
          ) {
            context.report({
              node,
              messageId: 'noDirectLocalStorage',
            });
          }
        },
      };
    },
  },

  'enforce-constants': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Enforce use of constants for specific magic numbers',
      },
    },
    create(context) {
      const forbiddenNumbers = [
        { value: 604800000, constant: 'TIME.ONE_WEEK' },
        { value: 86400000, constant: 'TIME.ONE_DAY' },
        { value: 1000, constant: 'TIME.ONE_SECOND' },
      ];

      return {
        Literal(node) {
          if (typeof node.value === 'number') {
            const forbidden = forbiddenNumbers.find(f => f.value === node.value);
            if (forbidden) {
              context.report({
                node,
                message: `Use constant ${forbidden.constant} instead of magic number ${node.value}`,
              });
            }
          }
        },
      };
    },
  },
};
