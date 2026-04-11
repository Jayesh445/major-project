/**
 * Seeds a realistic conversational negotiation session directly into MongoDB.
 * Shows the full Priya <-> Rajesh back-and-forth with real business context.
 */

const BACKEND = 'http://localhost:5000';
const INTERNAL_KEY = 'internal-sc-ai-secret-key-2024';

async function req(path, method = 'GET', body = null) {
  const res = await fetch(`${BACKEND}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': INTERNAL_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

async function main() {
  console.log('Fetching real product + supplier...');
  const suppliers = await req('/api/internal/suppliers');
  const supplier = suppliers[0];
  const productId = supplier.catalogProducts?.[0]?.product?._id || supplier.catalogProducts?.[0]?.product;
  const listPrice = supplier.catalogProducts?.[0]?.unitPrice || 150;

  if (!productId) {
    console.error('No supplier with catalog products found');
    return;
  }

  console.log(`Supplier: ${supplier.companyName}`);
  console.log(`Product: ${productId}`);
  console.log(`List price: Rs.${listPrice}`);

  // Create the negotiation session
  const negotiationBody = {
    supplier: supplier._id,
    product: productId,
    initiatedBy: 'procurement_officer',
    status: 'accepted',
    agentConstraints: {
      maxUnitPrice: Math.round(listPrice * 1.05),
      targetUnitPrice: Math.round(listPrice * 0.85),
      maxLeadTimeDays: 10,
      requiredQty: 100,
    },
    finalTerms: {
      unitPrice: Math.round(listPrice * 0.90),
      leadTimeDays: 7,
      paymentTermsDays: 30,
      moq: 100,
      savingsPercent: 10,
    },
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
    completedAt: new Date(),
  };

  const result = await req('/api/internal/negotiations', 'POST', negotiationBody);
  const negotiationId = result._id;
  console.log(`Created negotiation: ${negotiationId}`);

  // Add realistic conversational rounds
  const price1 = Math.round(listPrice * 0.82); // Priya's opening
  const price2 = Math.round(listPrice * 0.94); // Rajesh counter
  const price3 = Math.round(listPrice * 0.88); // Priya counter
  const price4 = Math.round(listPrice * 0.90); // Rajesh final

  const rounds = [
    {
      roundNumber: 1,
      agentOffer: { unitPrice: price1, leadTimeDays: 7, paymentTermsDays: 30, quantity: 100 },
      supplierCounterOffer: { unitPrice: price2, leadTimeDays: 7, paymentTermsDays: 30, quantity: 100 },
      agentReasoning: `Buyer: Hi Rajesh, hope you're doing well! We're finalizing our Q2 stationery stock and need 100 units of this SKU. I saw your listed price of Rs.${listPrice} but honestly, with the current market softening and our volume commitment, I was hoping we could start closer to Rs.${price1}. We've been ordering consistently from you and always pay on time — can you work with me on this? | Buyer reasoning: Opening 18% below list to anchor low. Mentioning relationship history to build rapport. Will concede 4-5% in next round if they counter reasonably. | Supplier: Priya ji, always a pleasure to hear from you. For 100 units, I can start at Rs.${price2} — that's already Rs.${listPrice - price2} off our list price. The thing is, raw material costs have gone up 8% this quarter and GST is eating into our margins. But you know our quality is consistent and we've never missed a delivery. Let me know your thoughts — I want to make this work.`,
      status: 'countered',
      timestamp: new Date(Date.now() - 180000),
    },
    {
      roundNumber: 2,
      agentOffer: { unitPrice: price3, leadTimeDays: 7, paymentTermsDays: 30, quantity: 100 },
      supplierCounterOffer: { unitPrice: price4, leadTimeDays: 7, paymentTermsDays: 30, quantity: 100 },
      agentReasoning: `Buyer: Thanks for getting back quickly, Rajesh. I hear you on the margins — I know these are tough times for everyone. But Rs.${price2} is still above my Q2 budget ceiling. I've got another quote at Rs.${Math.round(listPrice * 0.87)} from a vendor in Pune, but honestly, I'd rather work with you because of the quality consistency. Can you meet me at Rs.${price3}? I can commit to another order next quarter at similar volume. | Buyer reasoning: Applied competitive pressure without revealing pmax. Offered forward commitment as sweetener. Expecting final offer around Rs.${price4}. | Supplier: Priya, I really appreciate your loyalty and the forward commitment means a lot. Let me be straight with you — Rs.${price3} is really close to my floor. I had to check with my MD on this. The best I can do is Rs.${price4} with free delivery to your Mumbai warehouse. That's my absolute final offer for today — if it doesn't work, I completely understand and we'll catch the next opportunity.`,
      status: 'countered',
      timestamp: new Date(Date.now() - 120000),
    },
    {
      roundNumber: 3,
      agentOffer: { unitPrice: price4, leadTimeDays: 7, paymentTermsDays: 30, quantity: 100 },
      agentReasoning: `Buyer: Alright Rajesh, you got me. Rs.${price4} with free delivery works — deal! I'll process the PO today and my team will coordinate with your logistics for the Mumbai shipment. Really appreciate the quick turnaround and the added delivery perk. Looking forward to a smooth Q2, and we'll definitely line up next quarter's order early. Thanks again! | Buyer reasoning: Final price is within pmax (savings ~10%), lead time acceptable, payment terms standard. Relationship preserved, deal closed successfully. Recording outcome and creating PO.`,
      status: 'accepted',
      timestamp: new Date(Date.now() - 60000),
    },
  ];

  for (const round of rounds) {
    await req(`/api/internal/negotiations/${negotiationId}/rounds`, 'POST', round);
    console.log(`  Added round ${round.roundNumber}`);
  }

  console.log(`\nDone! View the negotiation at:`);
  console.log(`http://localhost:3000/dashboard/dev-tools/negotiations/${negotiationId}`);
  console.log(`\nOr fetch via API:`);
  console.log(`curl http://localhost:5000/api/agents/negotiation/sessions/${negotiationId}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
