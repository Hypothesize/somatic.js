module.exports = {
	"root": true,
	"env": { "browser": true, "node": true, "es6": true },
	"parser": "@typescript-eslint/parser",
	"parserOptions": { project: ['./tsconfig.json'] },
	"plugins": ["@typescript-eslint", "boundaries", "promise", "sonarjs", "jsdoc", "react", "mocha"],
	"extends": [
		"plugin:@typescript-eslint/recommended",
		"plugin:react/recommended",
		"plugin:jsdoc/recommended",
		"plugin:boundaries/strict",
		"plugin:mocha/recommended"
	],
	"noInlineConfig": true,
	"settings": {
		"jsdoc": {},
		"import/resolver": { typescript: { alwaysTryTypes: true, } },
		"boundaries/include": ["src/**", "test/**", "dist/**"],
		"boundaries/elements": [
			{ "type": "src", "pattern": "src/**" },
			{ "type": "test", "pattern": "test/**" },
			{ "type": "dist", "pattern": "dist/**" }
		]
	},
	"rules": {
		/* architecture */
		"boundaries/element-types": ["error", {
			"default": "disallow",
			"rules": [
				{ "from": ["test"], "allow": ["test", "src"] },
				{ "from": ["src"], "allow": ["src"] }
			]
		}],

		/* logic */
		"@typescript-eslint/no-explicit-any": "warn",
		"array-callback-return": "error",
		"no-self-compare": "error",
		"no-self-assign": "error",
		"no-duplicate-case": "error",
		"no-func-assign": "error",
		"no-dupe-else-if": "error",
		"no-loss-of-precision": "error",
		"no-constructor-return": "error",
		"no-async-promise-executor": "error",
		"for-direction": "error",
		"no-unreachable": "error",
		"no-constant-binary-expression": "error",
		"@typescript-eslint/no-non-null-assertion": "error",
		"@typescript-eslint/switch-exhaustiveness-check": "error",
		"sonarjs/no-all-duplicated-branches": "error", //All branches in a conditional structure should not have exactly the same implementation
		"sonarjs/no-element-overwrite": "error", // Collection elements should not be replaced unconditionally
		"sonarjs/no-empty-collection": "error", // Empty collections should not be accessed or iterated
		"sonarjs/no-extra-arguments": "error", // Function calls should not pass extra arguments
		"sonarjs/no-identical-conditions": "error", // Related "if/else if" statements should not have the same condition
		"sonarjs/no-identical-expressions": "error", // Identical expressions used on both sides of a binary operator
		"sonarjs/no-collection-size-mischeck": "error", // Testing array/collection size/length is greater than or equal to zero doesn't make sense
		"sonarjs/no-ignored-return": "error", // Return values from functions without side effects should not be ignored
		"sonarjs/no-one-iteration-loop": "error", // Loops with at most one iteration should be refactored
		"sonarjs/no-use-of-empty-return-value": "error", // The output of functions that don't return anything should not be used
		"sonarjs/non-existent-operator": "error", // Non-existent operators '=+', '=-' and '=!' should not be used
		"guard-for-in": "error", // using a for-in loop without filtering the results in the loop
		"init-declarations": ["error", "always"],

		"promise/no-multiple-resolved": "error",
		"promise/always-return": "warn",
		"promise/no-return-wrap": "error",
		"promise/param-names": "error",
		"promise/catch-or-return": "warn",
		// "promise/no-native": "off",
		"promise/no-nesting": "error",
		"promise/no-promise-in-callback": "error",
		"promise/no-callback-in-promise": "error",
		// "promise/avoid-new": "warn",
		"promise/no-new-statics": "error",
		"promise/no-return-in-finally": "warn",
		"promise/valid-params": "error",

		/* style */
		"promise/prefer-await-to-callbacks": "warn",
		"arrow-parens": ["error", "as-needed"],
		"no-template-curly-in-string": "error",
		"no-unexpected-multiline": "error", // confusing multiline expressions where a newline looks like it is ending a statement, but is not
		"sonarjs/prefer-object-literal": "error", // initialize object's properties in its declaration vs setting them one-by-one.
		"prefer-const": "error",
		"no-var": "warn",
		"eqeqeq": "error", // Use of type-unsafe equality operators such as == and != 
		"semi": ["error", "never"],
		"no-param-reassign": "error",
		"no-unused-expressions": "error",
		"sonarjs/no-unused-collection": "error", // Collection is populated but its contents never used
		"@typescript-eslint/strict-boolean-expressions": "error", // truthy/falsy boolean expressions
		"no-mixed-operators": "warn", // Use of different operators consecutively without parentheses in an expression
		"no-cond-assign": "error", // Ambiguous assignment operators in test conditions of if, for, while, and do...while statements
		"no-labels": "error", // Use of labeled statements
		"no-unused-labels": "error",
		"no-shadow-restricted-names": "error",
		"@typescript-eslint/no-shadow": ["error", { "ignoreTypeValueShadow": true }],
		"prefer-template": "error",
		"no-unsafe-negation": "error",
		"no-import-assign": "error",
		"no-global-assign": "error", // modifications to read-only global variables
		"no-new-wrappers": "error",
		"no-empty": "error", // empty block statements
		"max-params": ["error", 3], // max functions parameters count
		"@typescript-eslint/no-inferrable-types": "error",
		"@typescript-eslint/prefer-as-const": "error",
		"@typescript-eslint/ban-ts-comment": "error",
		"@typescript-eslint/ban-types": "warn",
		"@typescript-eslint/no-unnecessary-condition": ["error", { "allowConstantLoopConditions": true }],
		"no-return-await": "error",

		"sonarjs/prefer-single-boolean-return": "error", // Prefer `return expr` to `if (expr) {return true} else {return false}`
		"sonarjs/no-collapsible-if": "error", // Collapsible "if" statements should be merged
		"sonarjs/no-identical-functions": "error", // Functions with identical implementations
		"sonarjs/no-duplicate-string": ["warn", 7], // String literals that are duplicated
		"sonarjs/no-duplicated-branches": "error", // Two branches in a conditional structure with exactly the same implementation
		"sonarjs/no-redundant-jump": "error", // Redundant jump (return, break, continue) statements e.g., (x) => { if (x) { console.log("hi"); return; }}
		"sonarjs/no-redundant-boolean": "error",
		"sonarjs/no-useless-catch": "error", // "catch" clauses should do more than rethrow

		"no-shadow": "warn",
		"no-await-in-loop": "off",
		"require-atomic-updates": "warn",
		"no-invalid-this": "warn",
		"sonarjs/no-duplicate-string": "warn", // String literals that are duplicated
		// "no-unused-vars": "error",
		"@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "_" }],
		"@typescript-eslint/no-var-requires": "off", // require statements in import statements.
		"@typescript-eslint/explicit-module-boundary-types": "off",
		"@typescript-eslint/no-empty-function": "error",
		"@typescript-eslint/no-namespace": "off",
		"@typescript-eslint/no-empty-interface": "warn",
		"no-undef-init": "warn",

		/* formatting */
		"camelcase": ["warn", { "properties": "always", "ignoreImports": true }],
		"curly": ["warn", "multi-line"], // ensuring that block statements are wrapped in curly braces
		"brace-style": ["error", "stroustrup", { "allowSingleLine": true }],
		"space-in-parens": ["error", "never"],
		"block-spacing": ["error", "always"],
		"arrow-body-style": ["error", "as-needed"], // use of braces around arrow function body
		"indent": ["off", "tab", { "SwitchCase": 1 }],
		"no-irregular-whitespace": "warn", // invalid whitespace that is not a normal tab and space

		/* comments */
		"jsdoc/require-jsdoc": ["warn", {
			"require": {
				"FunctionDeclaration": true,
				"MethodDefinition": true,
				"ClassDeclaration": false,
				"ArrowFunctionExpression": false,
				"FunctionExpression": false
			},
			// "contexts": [
			// 	// "ExportNamedDeclaration",
			// 	"TSInterfaceDeclaration",
			// 	"TSTypeAliasDeclaration",
			// 	{ "context": ":not(TSTypeLiteral) > TSPropertySignature" },
			// 	"PropertyDefinition"
			// ],
			"exemptEmptyConstructors": true
		}],
		"jsdoc/require-param": "off",
		"jsdoc/require-yields": "off",
		"jsdoc/require-param-type": "off",
		"jsdoc/check-param-names": "off",
		"jsdoc/require-param-description": "warn",
		"jsdoc/require-returns": "off",
		"jsdoc/require-returns-type": "off",
		"jsdoc/multiline-blocks": ["error", { "noZeroLineText": false }],
		"jsdoc/newline-after-description": "off",
		"jsdoc/require-yields": "off",

		"no-warning-comments": ["warn", { "terms": ["todo"], "location": "anywhere" }],

		/* jsx */
		"react/jsx-key": "off",
		"react/jsx-first-prop-new-line": "warn",
		"react/react-in-jsx-scope": "off",
		"react/no-unknown-property": "warn",
		"react/prop-types": "off",
		"react/display-name": "off",
		// "react/jsx-closing-tag-location": "error",
		"react/no-unescaped-entities": "error",
		"react/self-closing-comp": "warn",
		"react/no-unescaped-entities": "warn",
		// "sonarjs/cognitive-complexity": "error",
		// "@typescript-eslint/await-thenable": "error",
		// "@typescript-eslint/naming-convention": "warn",
	}
}