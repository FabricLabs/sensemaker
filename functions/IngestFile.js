'use strict';

module.exports = async function IngestFile (...params) {
  console.debug('[INGEST]', 'Ingesting file...', params);

  try {
    const fileId = params[0];
    const file = await this.db('files').where('id', fileId).first();

    if (!file) {
      throw new Error(`File with ID ${fileId} not found`);
    }

    console.debug('[INGEST]', 'Found file record:', {
      id: file.id,
      name: file.name,
      type: file.type,
      creator: file.creator,
      fabric_id: file.fabric_id,
      blob_id: file.blob_id,
      preimage_sha256: file.preimage_sha256
    });

    // Read the file content from the blobs table instead of filesystem
    let blob;
    try {
      if (file.preimage_sha256) {
        blob = await this.db('blobs').where('preimage_sha256', file.preimage_sha256).first();
      } else if (file.blob_id) {
        blob = await this.db('blobs').where('fabric_id', file.blob_id).first();
      } else {
        throw new Error('No blob reference found in file record');
      }

      if (!blob) {
        throw new Error(`Blob not found for file ${file.name}`);
      }
    } catch (blobError) {
      console.error('[INGEST]', 'Failed to read file content from blobs table:', blobError);
      throw new Error(`Failed to read file content from database: ${blobError.message}`);
    }

    // Convert blob content to string for ingestion
    const fileContent = blob.content;
    const contentString = fileContent.toString('utf8');

    console.debug('[INGEST]', 'Retrieved file content from blob:', {
      blobId: blob.fabric_id,
      contentLength: contentString.length,
      mimeType: blob.mime_type
    });

    // Ingest the file content with comprehensive metadata
    const ingested = await this.trainer.ingestDocument({
      content: contentString,
      metadata: {
        owner: file.creator,
        file_id: file.id,
        fabric_id: file.fabric_id,
        filename: file.name,
        mime_type: file.type || blob.mime_type,
        type: 'file',
        blob_id: blob.fabric_id,
        preimage_sha256: file.preimage_sha256,
        file_size: fileContent.length,
        created_at: new Date().toISOString()
      }
    }, 'file');

    console.debug('[INGEST]', `Successfully ingested file content: ${ingested.content} chunks created`);

    // Update file status to 'ingested'
    await this.db('files').where('id', file.id).update({
      status: 'ingested',
      updated_at: new Date()
    });

    return {
      status: 'COMPLETED',
      ingested: {
        file_id: file.id,
        fabric_id: file.fabric_id,
        filename: file.name,
        chunks_created: ingested.content || 0,
        content_length: contentString.length,
        blob_id: blob.fabric_id
      }
    };
  } catch (error) {
    console.error('[INGEST]', 'Error ingesting file:', error);

    // Update file status to indicate ingestion failed
    if (params[0]) {
      try {
        await this.db('files').where('id', params[0]).update({
          status: 'failed',
          updated_at: new Date()
        });
      } catch (updateError) {
        console.error('[INGEST]', 'Failed to update file status to failed:', updateError);
      }
    }

    throw error;
  }
};
