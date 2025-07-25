// Backend API adapter for BlockData
// This file handles communication with the backend block data API

const BACKEND_URL = 'http://localhost:3000'; // Adjust as needed

export async function loadBlockDataFromBackend() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/blocks`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to load block data from backend:', error);
    // Return empty object on failure, fallback to hardcoded data
    return {};
  }
}

export async function getBlockDataFromBackend(blockId) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/blocks/${blockId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Failed to load block data for ID ${blockId}:`, error);
    return null;
  }
}

export async function loadBlockTexture(blockId) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/blocks/${blockId}/texture`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.texture;
  } catch (error) {
    console.error(`Failed to load texture for block ID ${blockId}:`, error);
    return null;
  }
}