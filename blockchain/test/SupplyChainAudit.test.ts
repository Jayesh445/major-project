import { expect } from 'chai';
import { ethers } from 'hardhat';
import { SupplyChainAudit } from '../typechain-types';

describe('SupplyChainAudit', () => {
  let contract: SupplyChainAudit;
  let owner: any;
  let backend: any;
  let outsider: any;

  // Helper: pad MongoDB ObjectId (24 hex chars) to bytes32 (64 hex chars)
  const toBytes32 = (hex: string) => {
    const clean = hex.replace(/^0x/, '').padStart(64, '0');
    return '0x' + clean;
  };

  const sampleRefId = toBytes32('69d88ada6e53869074a14967'); // ObjectId → bytes32
  const sampleHash = '0x' + 'a'.repeat(64); // fake SHA-256

  beforeEach(async () => {
    [owner, backend, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('SupplyChainAudit');
    contract = (await Factory.deploy()) as unknown as SupplyChainAudit;
    await contract.waitForDeployment();
  });

  describe('Deployment', () => {
    it('sets owner correctly', async () => {
      expect(await contract.owner()).to.equal(owner.address);
    });

    it('approves owner as submitter', async () => {
      expect(await contract.approvedSubmitters(owner.address)).to.be.true;
    });
  });

  describe('Access Control', () => {
    it('rejects unapproved submitters', async () => {
      await expect(
        contract.connect(outsider).logEvent(sampleRefId, 0, sampleHash, 1000)
      ).to.be.revertedWith('SupplyChainAudit: not approved submitter');
    });

    it('owner can add submitters', async () => {
      await contract.addSubmitter(backend.address);
      expect(await contract.approvedSubmitters(backend.address)).to.be.true;

      // New submitter can now log
      await expect(
        contract.connect(backend).logEvent(sampleRefId, 0, sampleHash, 1000)
      ).to.not.be.reverted;
    });

    it('non-owner cannot add submitters', async () => {
      await expect(
        contract.connect(outsider).addSubmitter(backend.address)
      ).to.be.revertedWith('SupplyChainAudit: only owner');
    });
  });

  describe('logEvent', () => {
    it('stores an entry and emits event', async () => {
      await expect(contract.logEvent(sampleRefId, 0, sampleHash, 45000))
        .to.emit(contract, 'AuditLogged')
        .withArgs(sampleRefId, 0, sampleHash, 45000, (ts: any) => ts > 0, owner.address);

      const count = await contract.getEntryCount(sampleRefId);
      expect(count).to.equal(1);
    });

    it('updates latestHashByRef', async () => {
      await contract.logEvent(sampleRefId, 0, sampleHash, 45000);
      const latest = await contract.latestHashByRef(sampleRefId, 0);
      expect(latest).to.equal(sampleHash);
    });

    it('rejects empty hash', async () => {
      await expect(
        contract.logEvent(sampleRefId, 0, ethers.ZeroHash, 1000)
      ).to.be.revertedWith('Empty documentHash');
    });

    it('rejects empty referenceId', async () => {
      await expect(
        contract.logEvent(ethers.ZeroHash, 0, sampleHash, 1000)
      ).to.be.revertedWith('Empty referenceId');
    });

    it('rejects invalid eventType', async () => {
      await expect(
        contract.logEvent(sampleRefId, 99, sampleHash, 1000)
      ).to.be.reverted;
    });

    it('supports multiple entries per reference', async () => {
      const hash2 = '0x' + 'b'.repeat(64);
      await contract.logEvent(sampleRefId, 0, sampleHash, 45000); // PO_CREATED
      await contract.logEvent(sampleRefId, 3, hash2, 45000);      // PO_RECEIVED

      const count = await contract.getEntryCount(sampleRefId);
      expect(count).to.equal(2);

      expect(await contract.latestHashByRef(sampleRefId, 0)).to.equal(sampleHash);
      expect(await contract.latestHashByRef(sampleRefId, 3)).to.equal(hash2);
    });
  });

  describe('verifyHash', () => {
    it('returns true for matching hash', async () => {
      await contract.logEvent(sampleRefId, 0, sampleHash, 45000);
      expect(await contract.verifyHash(sampleRefId, 0, sampleHash)).to.be.true;
    });

    it('returns false for wrong hash', async () => {
      await contract.logEvent(sampleRefId, 0, sampleHash, 45000);
      const wrongHash = '0x' + 'c'.repeat(64);
      expect(await contract.verifyHash(sampleRefId, 0, wrongHash)).to.be.false;
    });

    it('returns false for wrong event type', async () => {
      await contract.logEvent(sampleRefId, 0, sampleHash, 45000);
      expect(await contract.verifyHash(sampleRefId, 3, sampleHash)).to.be.false;
    });
  });

  describe('logEventsBatch', () => {
    it('logs multiple events in one tx', async () => {
      const refId2 = toBytes32('69d88ada6e53869074a14968');
      const hash2 = '0x' + 'b'.repeat(64);

      await contract.logEventsBatch(
        [sampleRefId, refId2],
        [0, 4], // PO_CREATED, NEGOTIATION_ACCEPTED
        [sampleHash, hash2],
        [45000, 30000]
      );

      expect(await contract.getEntryCount(sampleRefId)).to.equal(1);
      expect(await contract.getEntryCount(refId2)).to.equal(1);
      expect(await contract.latestHashByRef(sampleRefId, 0)).to.equal(sampleHash);
      expect(await contract.latestHashByRef(refId2, 4)).to.equal(hash2);
    });

    it('rejects length mismatch', async () => {
      await expect(
        contract.logEventsBatch(
          [sampleRefId],
          [0, 1],
          [sampleHash],
          [1000]
        )
      ).to.be.revertedWith('Length mismatch');
    });
  });

  describe('getEntries', () => {
    it('returns all entries for a reference', async () => {
      const hash2 = '0x' + 'b'.repeat(64);
      await contract.logEvent(sampleRefId, 0, sampleHash, 45000);
      await contract.logEvent(sampleRefId, 3, hash2, 45000);

      const entries = await contract.getEntries(sampleRefId);
      expect(entries.length).to.equal(2);
      expect(entries[0].eventType).to.equal(0);
      expect(entries[0].documentHash).to.equal(sampleHash);
      expect(entries[1].eventType).to.equal(3);
      expect(entries[1].documentHash).to.equal(hash2);
    });
  });

  describe('Tamper detection (adversarial test)', () => {
    it('detects tampering via hash mismatch', async () => {
      const originalPayload = { poNumber: 'PO-001', amount: 45000 };
      const originalHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(originalPayload)));

      await contract.logEvent(sampleRefId, 0, originalHash, 45000);

      // Attacker modifies the payload
      const tamperedPayload = { poNumber: 'PO-001', amount: 90000 }; // doubled
      const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(tamperedPayload)));

      const match = await contract.verifyHash(sampleRefId, 0, tamperedHash);
      expect(match).to.be.false;

      const originalMatch = await contract.verifyHash(sampleRefId, 0, originalHash);
      expect(originalMatch).to.be.true;
    });
  });
});
