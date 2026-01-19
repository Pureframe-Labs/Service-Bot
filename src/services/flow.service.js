const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class FlowService {
  constructor() {
    this.flowsDir = path.join(__dirname, '../flows');
  }

  async getFlow(flowName) {
    try {
      const filePath = path.join(this.flowsDir, `${flowName}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Error loading flow ${flowName}:`, error);
      throw error;
    }
  }

  async getAllFlows() {
    try {
      const files = await fs.readdir(this.flowsDir);
      const flows = {};
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const flowName = path.basename(file, '.json');
          flows[flowName] = await this.getFlow(flowName);
        }
      }
      
      return flows;
    } catch (error) {
      logger.error('Error loading flows:', error);
      return {};
    }
  }

  async processFlowResponse(flowToken, responseData) {
    // Process the flow response data
    // This would typically extract form data and prepare it for order creation
    try {
      const data = JSON.parse(responseData);
      return {
        success: true,
        data: data,
        flowToken,
      };
    } catch (error) {
      logger.error('Error processing flow response:', error);
      return {
        success: false,
        error: 'Invalid flow response data',
      };
    }
  }

  async createFlowCompletionResponse(userData, serviceType) {
    // This prepares the data from flow completion for order creation
    return {
      userData,
      serviceType,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = new FlowService();
