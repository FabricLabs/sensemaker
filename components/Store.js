'use strict';

// Dependencies
const React = require('react');

// Constants
const STORAGE_PREFIX = 'sensemaker_store_';
const DOCUMENTS_KEY = `${STORAGE_PREFIX}documents`;
const BLOBS_KEY = `${STORAGE_PREFIX}blobs`;
const METADATA_KEY = `${STORAGE_PREFIX}metadata`;

/**
 * Store component for managing localStorage persistence of documents and blobs.
 * Follows the singleton pattern similar to Bridge component.
 */
class Store extends React.Component {
  constructor(props) {
    super(props);

    this.settings = Object.assign({
      debug: false,
      maxDocuments: 1000, // Maximum number of documents to store
      maxBlobSize: 50 * 1024 * 1024, // 50MB max blob size
      compressionEnabled: true
    }, props);

    this.state = {
      documentsCount: 0,
      blobsCount: 0,
      totalSize: 0,
      isReady: false
    };

    // Internal collections
    this._documents = new Map();
    this._blobs = new Map();
    this._metadata = {
      lastSync: null,
      documentsCount: 0,
      blobsCount: 0,
      totalSize: 0
    };

    return this;
  }

  componentDidMount() {
    this.initialize();
  }

  /**
   * Initialize the store by loading existing data from localStorage
   */
  async initialize() {
    try {
      await this.loadFromStorage();
      this.setState({
        isReady: true,
        documentsCount: this._documents.size,
        blobsCount: this._blobs.size,
        totalSize: this.calculateTotalSize()
      });
      
      if (this.settings.debug) {
        console.debug('[STORE]', 'Initialized with', this._documents.size, 'documents and', this._blobs.size, 'blobs');
      }
    } catch (error) {
      console.error('[STORE]', 'Failed to initialize:', error);
    }
  }

  /**
   * Load data from localStorage
   */
  async loadFromStorage() {
    try {
      // Load documents
      const documentsData = localStorage.getItem(DOCUMENTS_KEY);
      if (documentsData) {
        const parsedDocuments = JSON.parse(documentsData);
        this._documents = new Map(Object.entries(parsedDocuments));
      }

      // Load blobs
      const blobsData = localStorage.getItem(BLOBS_KEY);
      if (blobsData) {
        const parsedBlobs = JSON.parse(blobsData);
        this._blobs = new Map(Object.entries(parsedBlobs));
      }

      // Load metadata
      const metadataData = localStorage.getItem(METADATA_KEY);
      if (metadataData) {
        this._metadata = { ...this._metadata, ...JSON.parse(metadataData) };
      }
    } catch (error) {
      console.error('[STORE]', 'Error loading from storage:', error);
      // Reset collections if loading fails
      this._documents.clear();
      this._blobs.clear();
      this._metadata = {
        lastSync: null,
        documentsCount: 0,
        blobsCount: 0,
        totalSize: 0
      };
    }
  }

  /**
   * Save data to localStorage
   */
  async saveToStorage() {
    try {
      // Save documents
      const documentsObj = Object.fromEntries(this._documents);
      localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documentsObj));

      // Save blobs
      const blobsObj = Object.fromEntries(this._blobs);
      localStorage.setItem(BLOBS_KEY, JSON.stringify(blobsObj));

      // Update and save metadata
      this._metadata = {
        ...this._metadata,
        lastSync: new Date().toISOString(),
        documentsCount: this._documents.size,
        blobsCount: this._blobs.size,
        totalSize: this.calculateTotalSize()
      };
      localStorage.setItem(METADATA_KEY, JSON.stringify(this._metadata));

      // Update component state
      this.setState({
        documentsCount: this._documents.size,
        blobsCount: this._blobs.size,
        totalSize: this._metadata.totalSize
      });

      if (this.settings.debug) {
        console.debug('[STORE]', 'Saved to storage successfully');
      }
    } catch (error) {
      console.error('[STORE]', 'Error saving to storage:', error);
      throw error;
    }
  }

  /**
   * Store a document as JSON
   */
  async storeDocument(id, document) {
    try {
      // Validate input
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid document ID');
      }

      // Serialize document to JSON
      const serialized = {
        id,
        data: document,
        timestamp: new Date().toISOString(),
        type: 'document'
      };

      // Check storage limits
      if (this._documents.size >= this.settings.maxDocuments) {
        await this.cleanup('documents');
      }

      // Store in memory collection
      this._documents.set(id, serialized);

      // Persist to localStorage
      await this.saveToStorage();

      if (this.settings.debug) {
        console.debug('[STORE]', 'Stored document:', id);
      }

      return true;
    } catch (error) {
      console.error('[STORE]', 'Error storing document:', error);
      throw error;
    }
  }

  /**
   * Store a blob (file, image, etc.)
   */
  async storeBlob(id, blob, metadata = {}) {
    try {
      // Validate input
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid blob ID');
      }

      if (!(blob instanceof Blob) && !(blob instanceof File)) {
        throw new Error('Invalid blob data');
      }

      // Check blob size limit
      if (blob.size > this.settings.maxBlobSize) {
        throw new Error(`Blob size (${blob.size}) exceeds maximum (${this.settings.maxBlobSize})`);
      }

      // Convert blob to base64
      const base64Data = await this.blobToBase64(blob);

      // Create blob entry
      const blobEntry = {
        id,
        data: base64Data,
        size: blob.size,
        type: blob.type,
        metadata,
        timestamp: new Date().toISOString()
      };

      // Store in memory collection
      this._blobs.set(id, blobEntry);

      // Persist to localStorage
      await this.saveToStorage();

      if (this.settings.debug) {
        console.debug('[STORE]', 'Stored blob:', id, 'Size:', blob.size);
      }

      return true;
    } catch (error) {
      console.error('[STORE]', 'Error storing blob:', error);
      throw error;
    }
  }

  /**
   * Retrieve a document by ID
   */
  getDocument(id) {
    const entry = this._documents.get(id);
    return entry ? entry.data : null;
  }

  /**
   * Retrieve a blob by ID
   */
  async getBlob(id) {
    try {
      const entry = this._blobs.get(id);
      if (!entry) return null;

      // Convert base64 back to blob
      const blob = await this.base64ToBlob(entry.data, entry.type);
      return {
        blob,
        metadata: entry.metadata,
        timestamp: entry.timestamp
      };
    } catch (error) {
      console.error('[STORE]', 'Error retrieving blob:', error);
      return null;
    }
  }

  /**
   * Get all document IDs
   */
  getDocumentIds() {
    return Array.from(this._documents.keys());
  }

  /**
   * Get all blob IDs
   */
  getBlobIds() {
    return Array.from(this._blobs.keys());
  }

  /**
   * Remove a document
   */
  async removeDocument(id) {
    if (this._documents.delete(id)) {
      await this.saveToStorage();
      if (this.settings.debug) {
        console.debug('[STORE]', 'Removed document:', id);
      }
      return true;
    }
    return false;
  }

  /**
   * Remove a blob
   */
  async removeBlob(id) {
    if (this._blobs.delete(id)) {
      await this.saveToStorage();
      if (this.settings.debug) {
        console.debug('[STORE]', 'Removed blob:', id);
      }
      return true;
    }
    return false;
  }

  /**
   * Clear all stored data
   */
  async clear() {
    try {
      this._documents.clear();
      this._blobs.clear();
      localStorage.removeItem(DOCUMENTS_KEY);
      localStorage.removeItem(BLOBS_KEY);
      localStorage.removeItem(METADATA_KEY);
      
      this.setState({
        documentsCount: 0,
        blobsCount: 0,
        totalSize: 0
      });

      if (this.settings.debug) {
        console.debug('[STORE]', 'Cleared all data');
      }
    } catch (error) {
      console.error('[STORE]', 'Error clearing data:', error);
      throw error;
    }
  }

  /**
   * Cleanup old entries to make space
   */
  async cleanup(type = 'both') {
    try {
      const now = new Date().getTime();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      if (type === 'documents' || type === 'both') {
        // Remove oldest documents
        const documentEntries = Array.from(this._documents.entries())
          .sort((a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime());
        
        // Remove 10% of oldest documents
        const toRemove = Math.floor(documentEntries.length * 0.1) || 1;
        for (let i = 0; i < toRemove && documentEntries.length > 0; i++) {
          this._documents.delete(documentEntries[i][0]);
        }
      }

      if (type === 'blobs' || type === 'both') {
        // Remove oldest blobs
        const blobEntries = Array.from(this._blobs.entries())
          .sort((a, b) => new Date(a[1].timestamp).getTime() - new Date(b[1].timestamp).getTime());
        
        // Remove 10% of oldest blobs
        const toRemove = Math.floor(blobEntries.length * 0.1) || 1;
        for (let i = 0; i < toRemove && blobEntries.length > 0; i++) {
          this._blobs.delete(blobEntries[i][0]);
        }
      }

      await this.saveToStorage();
      
      if (this.settings.debug) {
        console.debug('[STORE]', 'Cleanup completed for:', type);
      }
    } catch (error) {
      console.error('[STORE]', 'Error during cleanup:', error);
    }
  }

  /**
   * Calculate total storage size
   */
  calculateTotalSize() {
    let size = 0;
    
    // Calculate documents size
    for (const entry of this._documents.values()) {
      size += JSON.stringify(entry).length;
    }
    
    // Calculate blobs size
    for (const entry of this._blobs.values()) {
      size += entry.size || 0;
    }
    
    return size;
  }

  /**
   * Convert blob to base64
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:mime;base64, prefix
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert base64 to blob
   */
  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Get storage statistics
   */
  getStats() {
    return {
      documents: this._documents.size,
      blobs: this._blobs.size,
      totalSize: this.calculateTotalSize(),
      lastSync: this._metadata.lastSync,
      isReady: this.state.isReady
    };
  }

  render() {
    // Store component doesn't render anything visible
    return null;
  }
}

module.exports = Store; 