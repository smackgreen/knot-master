import { Client, Vendor, Contract } from "@/types";

export const TEMPLATE_PLACEHOLDERS = {
  CLIENT_NAME: "{{client_name}}",
  PARTNER_NAME: "{{partner_name}}",
  WEDDING_DATE: "{{wedding_date}}",
  VENUE: "{{venue}}",
  BUDGET: "{{budget}}",
  VENDOR_NAME: "{{vendor_name}}",
  VENDOR_CATEGORY: "{{vendor_category}}",
  VENDOR_COST: "{{vendor_cost}}",
  PLANNER_NAME: "{{planner_name}}",
  COMPANY_NAME: "{{company_name}}",
  COMPANY_ADDRESS: "{{company_address}}",
  COMPANY_CITY: "{{company_city}}",
  COMPANY_PHONE: "{{company_phone}}",
  COMPANY_EMAIL: "{{company_email}}",
  COMPANY_WEBSITE: "{{company_website}}",
  TODAY_DATE: "{{today_date}}",
  CONTRACT_ID: "{{contract_id}}",
  CONTRACT_NAME: "{{contract_name}}",
  EXPIRATION_DATE: "{{expiration_date}}",
};

/**
 * Merges template content with actual data from client, vendor, and user
 */
export function mergeTemplateWithData(
  templateContent: string,
  client?: Client,
  vendor?: Vendor,
  userData?: any,
  contract?: Partial<Contract>
): string {
  let content = templateContent;
  
  const today = new Date().toLocaleDateString();
  
  // Replace global placeholders
  content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.TODAY_DATE, 'g'), today);
  
  // Replace user/company placeholders
  if (userData) {
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.COMPANY_NAME, 'g'), userData.companyName || '');
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.COMPANY_ADDRESS, 'g'), userData.companyAddress || '');
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.COMPANY_CITY, 'g'), userData.companyCity || '');
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.COMPANY_PHONE, 'g'), userData.companyPhone || '');
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.COMPANY_EMAIL, 'g'), userData.companyEmail || '');
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.COMPANY_WEBSITE, 'g'), userData.companyWebsite || '');
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.PLANNER_NAME, 'g'), userData.name || '');
  }
  
  // Replace client placeholders
  if (client) {
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.CLIENT_NAME, 'g'), client.name);
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.PARTNER_NAME, 'g'), client.partnerName);
    
    // Format wedding date if it exists
    if (client.weddingDate) {
      const weddingDate = typeof client.weddingDate === 'string' 
        ? new Date(client.weddingDate).toLocaleDateString() 
        : client.weddingDate.toLocaleDateString();
      content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.WEDDING_DATE, 'g'), weddingDate);
    } else {
      content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.WEDDING_DATE, 'g'), '');
    }
    
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.VENUE, 'g'), client.venue || '');
    
    // Format budget if it exists
    if (client.budget?.totalBudget) {
      content = content.replace(
        new RegExp(TEMPLATE_PLACEHOLDERS.BUDGET, 'g'), 
        client.budget.totalBudget.toLocaleString()
      );
    } else {
      content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.BUDGET, 'g'), '');
    }
  }
  
  // Replace vendor placeholders
  if (vendor) {
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.VENDOR_NAME, 'g'), vendor.name);
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.VENDOR_CATEGORY, 'g'), vendor.category);
    
    // Format vendor cost if it exists
    if (vendor.cost) {
      content = content.replace(
        new RegExp(TEMPLATE_PLACEHOLDERS.VENDOR_COST, 'g'), 
        vendor.cost.toLocaleString()
      );
    } else {
      content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.VENDOR_COST, 'g'), '');
    }
  }
  
  // Replace contract placeholders
  if (contract) {
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.CONTRACT_ID, 'g'), contract.id || '');
    content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.CONTRACT_NAME, 'g'), contract.name || '');
    
    // Format expiration date if it exists
    if (contract.expiresAt) {
      content = content.replace(
        new RegExp(TEMPLATE_PLACEHOLDERS.EXPIRATION_DATE, 'g'), 
        new Date(contract.expiresAt).toLocaleDateString()
      );
    } else {
      content = content.replace(new RegExp(TEMPLATE_PLACEHOLDERS.EXPIRATION_DATE, 'g'), '');
    }
  }
  
  return content;
}

/**
 * Generates a default contract template for client agreements
 */
export function getDefaultClientTemplate(): string {
  return `
<h1 style="text-align: center;">WEDDING PLANNING AGREEMENT</h1>
<p style="text-align: center;"><strong>{{company_name}}</strong></p>
<p style="text-align: center;">{{company_address}}, {{company_city}}</p>
<p style="text-align: center;">{{company_phone}} | {{company_email}}</p>

<p><strong>CONTRACT ID:</strong> {{contract_id}}</p>
<p><strong>DATE:</strong> {{today_date}}</p>

<p>This Wedding Planning Agreement (the "Agreement") is entered into as of {{today_date}} by and between {{company_name}} ("Planner") and {{client_name}} ("Client").</p>

<h2>1. SERVICES</h2>
<p>Planner agrees to provide wedding planning services for Client's wedding scheduled for {{wedding_date}} at {{venue}}.</p>

<h2>2. PAYMENT</h2>
<p>Client agrees to pay Planner the total sum of $_____ for services outlined in this agreement. A non-refundable deposit of $_____ is due upon signing this agreement, with the remaining balance due as follows:</p>
<ul>
  <li>50% due 90 days prior to the wedding date</li>
  <li>Remaining balance due 30 days prior to the wedding date</li>
</ul>

<h2>3. CANCELLATION</h2>
<p>In the event of cancellation by Client, all payments made to date are non-refundable. Cancellations must be submitted in writing.</p>

<h2>4. TERM</h2>
<p>This Agreement shall remain in effect until the completion of services or until terminated by either party as provided herein.</p>

<h2>5. SIGNATURES</h2>
<p>By signing below, both parties acknowledge that they have read, understood, and agree to the terms and conditions outlined in this Agreement.</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px;">
  <div style="width: 45%;">
    <p>CLIENT:</p>
    <p>{{client_name}}</p>
    <p>Date: ____________</p>
    <p>Signature: ____________</p>
  </div>
  <div style="width: 45%;">
    <p>PLANNER:</p>
    <p>{{planner_name}}</p>
    <p>Date: ____________</p>
    <p>Signature: ____________</p>
  </div>
</div>
`;
}

/**
 * Generates a default contract template for vendor agreements
 */
export function getDefaultVendorTemplate(): string {
  return `
<h1 style="text-align: center;">VENDOR AGREEMENT</h1>
<p style="text-align: center;"><strong>{{company_name}}</strong></p>
<p style="text-align: center;">{{company_address}}, {{company_city}}</p>
<p style="text-align: center;">{{company_phone}} | {{company_email}}</p>

<p><strong>CONTRACT ID:</strong> {{contract_id}}</p>
<p><strong>DATE:</strong> {{today_date}}</p>

<p>This Vendor Agreement (the "Agreement") is entered into as of {{today_date}} by and between {{company_name}} ("Planner"), {{client_name}} ("Client"), and {{vendor_name}} ("Vendor").</p>

<h2>1. SERVICES</h2>
<p>Vendor agrees to provide {{vendor_category}} services for Client's wedding scheduled for {{wedding_date}} at {{venue}}.</p>

<h2>2. PAYMENT</h2>
<p>Client agrees to pay Vendor the total sum of {{vendor_cost}} for services outlined in this agreement. A non-refundable deposit of $_____ is due upon signing this agreement, with the remaining balance due as follows:</p>
<ul>
  <li>50% due 90 days prior to the wedding date</li>
  <li>Remaining balance due 30 days prior to the wedding date</li>
</ul>

<h2>3. CANCELLATION</h2>
<p>In the event of cancellation by Client, all payments made to date are non-refundable. Cancellations must be submitted in writing.</p>

<h2>4. TERM</h2>
<p>This Agreement shall remain in effect until the completion of services or until terminated by any party as provided herein.</p>

<h2>5. SIGNATURES</h2>
<p>By signing below, all parties acknowledge that they have read, understood, and agree to the terms and conditions outlined in this Agreement.</p>

<div style="display: flex; justify-content: space-between; margin-top: 50px;">
  <div style="width: 30%;">
    <p>CLIENT:</p>
    <p>{{client_name}}</p>
    <p>Date: ____________</p>
    <p>Signature: ____________</p>
  </div>
  <div style="width: 30%;">
    <p>VENDOR:</p>
    <p>{{vendor_name}}</p>
    <p>Date: ____________</p>
    <p>Signature: ____________</p>
  </div>
  <div style="width: 30%;">
    <p>PLANNER:</p>
    <p>{{planner_name}}</p>
    <p>Date: ____________</p>
    <p>Signature: ____________</p>
  </div>
</div>
`;
}
