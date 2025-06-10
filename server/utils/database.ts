/**
 * Parsea una sentencia SQL CREATE TABLE y devuelve un objeto JSON con la información extraída:
 * - schema: Nombre del esquema (si existe)
 * - table: Nombre de la tabla
 * - columns: Arreglo de objetos con información de cada columna (nombre, tipo, longitud, precisión, escala y restricciones)
 * - constraints: Arreglo con constraints a nivel de tabla (como PRIMARY KEY, FOREIGN KEY, etc.)
 *
 * Nota: Este parser es básico y está pensado para definiciones SQL "estándar" en distintos dialectos
 * (PostgreSQL, SQLite, Oracle, SQL Server). Puede necesitar ajustes para casos muy complejos.
 *
 * @param {string} sql - La sentencia SQL CREATE TABLE.
 * @returns {object} Objeto con la estructura: { schema, table, columns, constraints }.
 */
export function parseSQLCreateTable(query: string) {
	// 1. Normalizar la cadena: eliminar saltos de línea y espacios redundantes.
	const sql = query.replace(/\s+/g, ' ').trim()

	// 2. Extraer el nombre de la tabla y opcionalmente el esquema.
	// Se permite la cláusula opcional IF NOT EXISTS y nombres entre comillas/backticks/corchetes.
	const tableRegex =
		/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:["`\[]?(\w+)["`\]]?\.)?(?:["`\[]?(\w+)["`\]]?)/i
	const tableMatch = sql.match(tableRegex)
	if (!tableMatch) {
		throw new Error('No se pudo encontrar el nombre de la tabla.')
	}
	const schema = tableMatch[1] || null
	const tableName = tableMatch[2]

	// 3. Extraer el contenido entre paréntesis (definición de columnas y constraints)
	const parenMatch = sql.match(/\(([\s\S]+)\)/)
	if (!parenMatch) {
		throw new Error(
			'No se pudo extraer la definición interna (columnas/constraints).'
		)
	}
	const innerDefinition = parenMatch[1].trim()

	// 4. Dividir la definición en fragmentos separados por comas que NO estén dentro de paréntesis.
	const definitions = []
	let buffer = ''
	let parenCount = 0
	for (let i = 0; i < innerDefinition.length; i++) {
		const char = innerDefinition[i]
		if (char === '(') {
			parenCount++
		} else if (char === ')') {
			parenCount--
		}
		if (char === ',' && parenCount === 0) {
			definitions.push(buffer.trim())
			buffer = ''
		} else {
			buffer += char
		}
	}
	if (buffer.trim()) {
		definitions.push(buffer.trim())
	}

	// Función auxiliar 1:
	// Extrae, a partir de la cadena (resto de la definición después del nombre de columna),
	// los tokens que corresponden al tipo hasta encontrar una palabra clave (que indica restricciones).
	function extractTypeAndRemaining(str: string) {
		const tokens = str.split(/\s+/)
		// Lista de palabras que indican el inicio de restricciones.
		// Se agregó "NULL" para que no se incluya en el tipo.
		const constraintKeywords = new Set([
			'NULL',
			'NOT',
			'DEFAULT',
			'PRIMARY',
			'UNIQUE',
			'CHECK',
			'REFERENCES',
			'COLLATE',
			'CONSTRAINT',
			'AUTO_INCREMENT',
			'IDENTITY'
		])
		const typeTokens = []
		let i = 0
		while (
			i < tokens.length &&
			!constraintKeywords.has(tokens[i].toUpperCase())
		) {
			typeTokens.push(tokens[i])
			i++
		}
		return {
			typeStr: typeTokens.join(' '),
			remaining: tokens.slice(i).join(' ')
		}
	}

	// Función auxiliar 2:
	// A partir del string que representa el tipo (por ejemplo, "VARCHAR(255)" o "DOUBLE PRECISION")
	// extrae el tipo base y, si existen, los parámetros entre paréntesis (longitud o precisión/escala).
	function parseColumnTypeAndParams(typeStr: string) {
		// Esta expresión regular permite capturar:
		//   - El tipo base (una secuencia de tokens, separados por espacios)
		//   - Opcionalmente, los parámetros entre paréntesis.
		const regex = /^([A-Z0-9_]+(?:\s+[A-Z0-9_]+)*)(\(([^)]+)\))?$/i
		const m = typeStr.match(regex)
		if (!m) {
			return { colType: typeStr, length: null, precision: null, scale: null }
		}
		const colType = m[1].trim()
		const params = m[3] ? m[3].trim() : null
		let length = null
		let precision = null
		let scale = null
		if (params) {
			const parts = params.split(',').map((s) => s.trim())
			if (parts.length === 1) {
				length = parts[0]
			} else if (parts.length === 2) {
				precision = parts[0]
				scale = parts[1]
			} else {
				length = params
			}
		}
		return { colType, length, precision, scale }
	}

	// 5. Procesar cada fragmento: puede ser la definición de una columna o un constraint a nivel de tabla.
	const columns: any[] = []
	const tableConstraints: any[] = []

	for (const def of definitions) {
		// Si la definición comienza con palabras clave de constraints a nivel de tabla, se guarda aparte.
		if (/^(PRIMARY\s+KEY|FOREIGN\s+KEY|CONSTRAINT|UNIQUE|CHECK)/i.test(def)) {
			tableConstraints.push(def)
			continue
		}

		// Extraer el nombre de la columna (primer token, permitiendo comillas/backticks/corchetes).
		const colNameMatch = def.match(/^[`'"\[]?(\w+)[`'"\]]?\s+/)
		if (!colNameMatch) continue
		const colName = colNameMatch[1]

		// Remover el nombre de la columna del string.
		const rest = def.slice(colNameMatch[0].length).trim()

		// Extraer el tipo y el resto de la definición (restricciones, etc.).
		const { typeStr, remaining } = extractTypeAndRemaining(rest)
		const { colType, length, precision, scale } =
			parseColumnTypeAndParams(typeStr)
		const colConstraints = remaining || null

		columns.push({
			name: colName,
			type: colType?.toUpperCase(),
			length: length,
			precision: precision,
			scale: scale,
			constraints: colConstraints?.toUpperCase()
		})
	}

	// 6. Retornar el objeto con la información extraída.
	return {
		schema: schema, // Esquema (null si no se especifica)
		table: tableName, // Nombre de la tabla
		columns: columns, // Arreglo de columnas
		constraints: tableConstraints // Constraints a nivel de tabla
	}
}
