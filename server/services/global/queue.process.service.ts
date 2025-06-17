import type { INode, INodeClass } from '@shared/interface/node.interface.js';
import type { IWorkflow } from '@shared/interface/workflow.interface.js';
import fs from 'node:fs';
import { queueService, QueueServiceListResultItem } from './queue.service.js';
import { v4 as uuidv4 } from 'uuid';
import { getNodeClass } from '@shared/maps/nodes.map.js';
import { DeploymentsQueue_Table as DeploymentsQueueTable } from '../../database/entity/global.deploymentsQueue.entity.js';

// Define constant paths for source files and directories.
const originPathEnv: string = './.env.prod';
const originPathPackage: string = './package.json';
const originPathShared: string = './dist/shared/';
const originPathWorker: string = './dist/worker/';

/**
 * @interface ProcessQueueItem
 * @description Extends QueueServiceListResultItem to include an optional flow property.
 * Represents an item being processed from the queue.
 * @property {IWorkflow} [flow] - Optional workflow definition associated with the queue item.
 */
interface ProcessQueueItem extends QueueServiceListResultItem {
	flow?: IWorkflow;
}

/**
 * @interface QueueServiceListResult
 * @description Represents the result structure from `queueService().list()`, containing items to process.
 * @property {ProcessQueueItem[]} [deploys] - An array of queue items.
 */
interface QueueServiceListResult {
    deploys?: ProcessQueueItem[];
}

/**
 * @interface NodeInfo
 * @description Basic information about a node, used for package extraction.
 * @property {string} id - The node's unique ID.
 * @property {string} type - The type or group of the node.
 * @property {any} properties - The node's properties.
 */
interface NodeInfo {
	id: string;
	type: string;
	properties: any;
}

/**
 * @interface PackageJson
 * @description Defines the structure of a package.json file, focusing on dependencies and scripts.
 * @property {object} dependencies - Production dependencies.
 * @property {object} [devDependencies] - Development dependencies (will be removed).
 * @property {object} scripts - Scripts defined in package.json.
 * @property {any} [key] - Allows for other properties in package.json.
 */
interface PackageJson {
	dependencies: { [key: string]: string };
	devDependencies?: { [key: string]: string };
	scripts: { [key: string]: string };
	[key: string]: any;
}

/**
 * @async
 * @function queueProcess
 * @description Processes items from the deployment queue that are in status 6 (queued for processing).
 * For each item, it creates a deployment directory, extracts necessary files and node configurations,
 * and then updates the item's status to 3 (ready for deployment) or 4 (error).
 * @returns {Promise<void>} A promise that resolves when all relevant queue items have been processed.
 * @throws Will re-throw an error if processing an item fails, after attempting to clean up and update status.
 */
export async function queueProcess(): Promise<void> {
	// Retrieve queue items with status 6 (queued for file extraction)
	const listResult: QueueServiceListResult | null = await queueService().list({ status: [6] });

	for (const item of listResult?.deploys || []) {
		const uid: string = uuidv4(); // Generate a unique ID for the deployment directory
		const path: string = `./data/deployments/${uid}`; // Define the deployment path

		fs.mkdirSync(path, { recursive: true }); // Create the deployment directory

		try {
			// If the item has a flow definition with nodes, extract them
			if (item.flow?.nodes) {
				// Note: queueExtract is synchronous. 'await' here has no effect unless queueExtract becomes async.
				// Consider making queueExtract async if it involves async file operations for better performance.
				queueExtract({
					path,
					nodes: item.flow.nodes,
					flow: item.flow,
				});
			}

			// Update queue item status to 3 (processed, ready for deployment)
			await DeploymentsQueueTable.update(
				{
					id_status: 3,
					meta: { path }, // Store the deployment path in meta
				},
				{ where: { id: item.id } }
			);
		} catch (error: unknown) {
			let message: string = 'Error during queue processing';
			if (error instanceof Error) {
				message = error.toString();
			}
			// Attempt to remove the deployment directory on error
			fs.rmSync(path, { recursive: true, force: true }); // Added force for robustness

			// Update queue item status to 4 (error)
			await DeploymentsQueueTable.update(
				{
					description: message,
					id_status: 4,
				},
				{ where: { id: item.id } }
			);
			throw error; // Re-throw the error to indicate failure for this item
		}
	}
}

/**
 * @interface QueueExtractParams
 * @description Parameters for the `queueExtract` function.
 * @property {string} path - The base path for the extraction.
 * @property {{ [key: string]: INode }} nodes - A map of nodes in the workflow.
 * @property {IWorkflow} flow - The workflow definition.
 */
interface QueueExtractParams {
	path: string;
	nodes: { [key: string]: INode };
	flow: IWorkflow;
}

/**
 * @function queueExtract
 * @description Extracts shared files, worker files, environment configuration, workflow definition,
 * and node-specific files into the specified deployment path.
 * @param {QueueExtractParams} params - The parameters for extraction.
 */
function queueExtract({ path, nodes, flow }: QueueExtractParams): void {
	const destinyWorkflow: string = `${path}/data/workflows/default`;
	const destinyPluginsNode: string = `${path}/shared/plugins/nodes/`;
	const sharedPaths: string[] = ['interfaces', 'utils', 'plugins/utils', 'store', 'class'];

	const destinyWorker: string = `${path}/worker/`;
	const destinyEnv: string = `${path}/.env`;

	// Copy shared library files
	for (const itemPath of sharedPaths) {
		fs.cpSync(`${originPathShared}/${itemPath}`, `${path}/shared/${itemPath}`, {
			recursive: true,
		});
	}

	// Copy worker files
	fs.cpSync(`${originPathWorker}`, `${destinyWorker}`, { recursive: true });

	// Copy environment file
	fs.copyFileSync(`${originPathEnv}`, `${destinyEnv}`);

	// Create directory for workflow and write flow.json
	fs.mkdirSync(`${destinyWorkflow}`, { recursive: true });
	fs.writeFileSync(`${destinyWorkflow}/flow.json`, JSON.stringify(flow, null, 2));

	// Extract node-specific files
	const extractedNodes: NodeInfo[] = [];
	for (const node of Object.values(nodes)) {
		extractedNodes.push({
			id: node.id || '', // Ensure ID is not undefined
			type: node.info.group,
			properties: node.properties,
		});
		const pathOrigin: string = node.info.group.split('/').slice(0, -1).join('/');
		const pathNode: string = `${originPathShared}plugins/nodes/${node.info.group}`;

		if (!fs.existsSync(pathNode)) {
			throw new Error(`Node plugin not found: ${node.info.group}`);
		}
		// Create target directory for the node plugin and copy files
		fs.mkdirSync(`${destinyPluginsNode}/${pathOrigin}`, { recursive: true });
		fs.cpSync(pathNode, `${destinyPluginsNode}/${node.info.group}`, { recursive: true });
	}

	// Prepare and write package.json for the deployment
	queueExtractPackage({ path, listNodes: extractedNodes });
}

/**
 * @interface QueueExtractPackageParams
 * @description Parameters for `queueExtractPackage` function.
 * @property {string} path - The base path for the deployment.
 * @property {NodeInfo[]} listNodes - List of node information for dependency calculation.
 */
interface QueueExtractPackageParams {
	path: string;
	listNodes: NodeInfo[];
}

/**
 * @function queueExtractPackage
 * @description Generates a package.json file for the deployment based on node dependencies.
 * It reads a template package.json, identifies required dependencies for the nodes in the workflow,
 * and writes a new package.json with tailored dependencies and start script.
 * @param {QueueExtractPackageParams} params - The parameters for package extraction.
 */
function queueExtractPackage({ path, listNodes }: QueueExtractPackageParams): void {
	const nodeClassMap = getNodeClass();
	const destinyPackage: string = `${path}/package.json`;

	const dependencies: Set<string> = new Set(); // Use a Set to avoid duplicate dependencies
	// Iterate over nodes to collect their dependencies
	for (const node of listNodes) {
		const nodeClassItem = nodeClassMap[node.type];
		if (!nodeClassItem) continue; // Skip if node class info is not found

		const nodeInstance: INodeClass = new (nodeClassItem.class as any)();
		let nodeDependencies: string[] | null = null;
		// If node has an onDeploy method, execute it to potentially get dynamic dependencies
		if (nodeInstance.onDeploy) {
			nodeInstance.properties = node.properties; // Assign properties before calling onDeploy
			nodeInstance.onDeploy();
			nodeDependencies = nodeInstance.dependencies || [];
		}
		// Add static or dynamic dependencies to the set
		for (const dependency of nodeDependencies || nodeClassItem.dependencies || []) {
			dependencies.add(dependency);
		}
	}

	// Read the template package.json
	const packageFileContent: string = fs.readFileSync(originPathPackage, 'utf8');
	const packageJson: PackageJson = JSON.parse(packageFileContent);

	// Filter dependencies from template based on collected set
	const flowDependencies: { [key: string]: string } = {};
	for (const dependency of dependencies) {
		if (packageJson.dependencies[dependency]) {
			flowDependencies[dependency] = packageJson.dependencies[dependency];
		} else if (packageJson.devDependencies && packageJson.devDependencies[dependency]) {
			flowDependencies[dependency] = packageJson.devDependencies[dependency]; // Include dev dependencies if matched
		}
	}

	// Clean up and set new dependencies and scripts
	delete packageJson.devDependencies;
	packageJson.dependencies = {
		...packageJson.dependencies, // Keep original dependencies from template
		...flowDependencies, // Add workflow-specific dependencies
	};
	packageJson.scripts = {
		start: 'node worker/index.js  --FLOW=default', // Define the start script for the worker
	};

	// Write the new package.json to the deployment directory
	fs.writeFileSync(destinyPackage, JSON.stringify(packageJson, null, 2));
}
