import { Sequelize } from 'sequelize'
import envs from '../../shared/utils/envs.js'

export let connect: Sequelize

if (envs.DATABASE_DIALECT === 'sqlite') {
	connect = new Sequelize({
		dialect: 'sqlite',
		storage: envs.DATABASE_STORAGE,
		logging: false,
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000
		},
		define: {
			freezeTableName: true,
			timestamps: false,
			underscored: true
		}
	})
} else {
	connect = new Sequelize(envs.DATABASE_URL, {
		dialect: envs.DATABASE_DIALECT,
		logging: false,
		pool: {
			max: 5,
			min: 0,
			acquire: 30000,
			idle: 10000
		},
		define: {
			freezeTableName: true,
			timestamps: false,
			underscored: true
		}
	})
}
