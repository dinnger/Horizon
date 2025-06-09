import 'monaco-editor/esm/vs/editor/editor.all.js'
import * as monaco from 'monaco-editor'
const suggestionsLang: Map<string, any> = new Map()

export function suggestion(pSuggestions: any, lang: string) {
	if (suggestionsLang.has(lang)) suggestionsLang.get(lang)()
	const { dispose } = monaco.languages.registerCompletionItemProvider(lang, {
		// triggerCharacters: ['{',],
		provideCompletionItems: (model, position) => {
			// parse the current suggestion position
			const suggestions: any = []
			const textUntilPosition = model.getValueInRange({
				startLineNumber: position.lineNumber,
				startColumn: 1,
				endLineNumber: position.lineNumber,
				endColumn: position.column
			})
			const word = model.getWordUntilPosition(position)
			const range = {
				startLineNumber: position.lineNumber,
				endLineNumber: position.lineNumber,
				startColumn: word.startColumn,
				endColumn: word.endColumn
			}
			// Match handlebars opening delimiter
			if (textUntilPosition.match(/.*{{/m)) {
				for (const snippet of pSuggestions) {
					// Push handlebars snippets
					suggestions.push({
						label: snippet.label,
						kind: monaco.languages.CompletionItemKind.Property,
						insertText: `${snippet.label}`,
						range: range,
						detail: snippet.value
					})
				}
			}

			return {
				suggestions
			}
		}
	})
	suggestionsLang.set(lang, dispose)
}

export { monaco }
