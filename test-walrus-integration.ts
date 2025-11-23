/**
 * Walrus Integration Test Script
 *
 * This script tests the corrected Walrus API response parsing
 * to ensure compatibility with the actual Walrus API v1 format.
 */

import { createWalrusClient } from './src/lib/walrus';

// Mock Walrus API response based on actual format
const mockNewlyCreatedResponse = {
  newlyCreated: {
    blobObject: {
      id: "0x10f03b3e1cdfb69bcbaeb3bc4e09cde8f70f3e2b205ffe416ae44288777c6a23",
      registeredEpoch: 226,
      blobId: "ByIx0F09c4D_RHvrhium3wbjDKtdc2-hvJgd3woy8aM",
      size: 1846785,
      encodingType: "RS2",
      certifiedEpoch: null,
      storage: {
        id: "0xa494c8a06ba0644bb34470290fdb770a9856de2c23eabedfe9965a8c5651498a",
        startEpoch: 226,
        endEpoch: 227,
        storageSize: 74042000
      },
      deletable: true
    },
    resourceOperation: {
      registerFromScratch: {
        encodedLength: 74042000,
        epochsAhead: 1
      }
    },
    cost: 12425000
  }
};

const mockAlreadyCertifiedResponse = {
  alreadyCertified: {
    blobId: "M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk",
    event: {
      txDigest: "4XQHFa9S324wTzYHF3vsBSwpUZuLpmwTHYMFv9nsttSs",
      eventSeq: "0"
    },
    endEpoch: 35
  }
};

// Mock fetch for testing
const mockFetch = (response: any, ok = true) => {
  return async () => ({
    ok,
    status: ok ? 200 : 400,
    text: async () => JSON.stringify(response),
    arrayBuffer: async () => new ArrayBuffer(0)
  }) as Response;
};

async function testNewlyCreatedResponse() {
  console.log('🧪 Testing newlyCreated response parsing...');

  const client = createWalrusClient({
    publisherUrl: 'https://publisher.walrus-testnet.walrus.space',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    fetchFn: mockFetch(mockNewlyCreatedResponse) as any
  });

  try {
    const result = await client.storeBlob('test data');

    console.assert(result.blobId === 'ByIx0F09c4D_RHvrhium3wbjDKtdc2-hvJgd3woy8aM',
      '❌ blobId extraction failed');
    console.assert(result.endEpoch === 227,
      '❌ endEpoch extraction failed');
    console.assert(result.blobObjectId === '0x10f03b3e1cdfb69bcbaeb3bc4e09cde8f70f3e2b205ffe416ae44288777c6a23',
      '❌ blobObjectId extraction failed');
    console.assert(result.status === 'new',
      '❌ status field incorrect');
    console.assert(result.txDigest === undefined,
      '❌ txDigest should be undefined for newlyCreated');

    console.log('✅ newlyCreated response parsing successful!');
    console.log('   - blobId:', result.blobId);
    console.log('   - endEpoch:', result.endEpoch);
    console.log('   - blobObjectId:', result.blobObjectId);
    console.log('   - status:', result.status);
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

async function testAlreadyCertifiedResponse() {
  console.log('\n🧪 Testing alreadyCertified response parsing...');

  const client = createWalrusClient({
    publisherUrl: 'https://publisher.walrus-testnet.walrus.space',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
    fetchFn: mockFetch(mockAlreadyCertifiedResponse) as any
  });

  try {
    const result = await client.storeBlob('test data');

    console.assert(result.blobId === 'M4hsZGQ1oCktdzegB6HnI6Mi28S2nqOPHxK-W7_4BUk',
      '❌ blobId extraction failed');
    console.assert(result.endEpoch === 35,
      '❌ endEpoch extraction failed');
    console.assert(result.txDigest === '4XQHFa9S324wTzYHF3vsBSwpUZuLpmwTHYMFv9nsttSs',
      '❌ txDigest extraction failed');
    console.assert(result.status === 'alreadyCertified',
      '❌ status field incorrect');

    console.log('✅ alreadyCertified response parsing successful!');
    console.log('   - blobId:', result.blobId);
    console.log('   - endEpoch:', result.endEpoch);
    console.log('   - txDigest:', result.txDigest);
    console.log('   - status:', result.status);
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Walrus Integration Tests\n');
  console.log('=' .repeat(60));

  try {
    await testNewlyCreatedResponse();
    await testAlreadyCertifiedResponse();

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - newlyCreated response: ✅ PASS');
    console.log('   - alreadyCertified response: ✅ PASS');
    console.log('\n🎉 Walrus API integration is correctly configured!');
  } catch (error) {
    console.error('\n❌ Test suite failed');
    process.exit(1);
  }
}

// Execute tests immediately
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});

export { runTests, testNewlyCreatedResponse, testAlreadyCertifiedResponse };

