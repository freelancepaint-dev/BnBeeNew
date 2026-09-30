const { createPublicClient, http, formatEther, parseAbiItem } = require('viem');
const fs = require('fs');
const STATE_FILE = 'hire-alert-state.json';
let seen = new Set();

if (fs.existsSync(STATE_FILE)) {
  seen = new Set(JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')));
}
const CONTRACT = '0x9dE16778D63953B3F778128B1D5cA0c88B797c72';
const CHAT_ID = '-1003999247973';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const client = createPublicClient({
  transport: http('https://bsc-dataseed.bnbchain.org')
});

async function sendTelegram(message) {
  const response = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Telegram error: ${await response.text()}`);
  }
}

async function main() {
  if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is missing');

  const latestBlock = await client.getBlockNumber();
  const fromBlock = latestBlock > 300n ? latestBlock - 300n : 0n;

  const blocks = [];
  for (let n = fromBlock; n <= latestBlock; n++) {
    blocks.push(await client.getBlock({ blockNumber: n, includeTransactions: true }));
  }

  for (const block of blocks) {
    for (const tx of block.transactions) {
      if (
        tx.to?.toLowerCase() === CONTRACT.toLowerCase() &&
      
        tx.value > 0n &&
tx.input?.startsWith('0xdb663865')
) {

        const receipt = await client.getTransactionReceipt({ hash: tx.hash });
        if (receipt.status !== 'success') continue;
        if (seen.has(tx.hash)) continue;
        const bnb = Number(formatEther(tx.value)).toFixed(4);

        await sendTelegram(
          `🐝 <b>NEW BNBEEHIVE HIRE!</b>\n\n` +
          `💰 <b>${bnb} BNB</b>\n` +
          `🍯 The Hive is growing!\n\n` +
          `<a href="https://bscscan.com/tx/${tx.hash}">View Transaction</a>\n\n` +
          `<b>Build the Hive. Compound the Honey.</b>`
        );
        seen.add(tx.hash);
        fs.writeFileSync(STATE_FILE, JSON.stringify([...seen]));
        console.log(`Alert sent: ${tx.hash}`);
      }
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
