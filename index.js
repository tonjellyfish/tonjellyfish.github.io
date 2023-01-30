const nacl = TonWeb.utils.nacl // use nacl library for key pairs
const tonweb = new TonWeb(
  new TonWeb.HttpProvider("https://toncenter.com/api/v2/jsonRPC", {
    apiKey: "50295aff73923830ffc986db4e0364c2be940758e153314d236d403ab90051f4",
  })
)
const tonMnemonic = TonWeb.mnemonic

function utf8_to_b64(str) {
  return window.btoa(unescape(encodeURIComponent(str)))
}
function b64_to_utf8(str) {
  return decodeURIComponent(escape(window.atob(str)))
}
let wallet
let keyPair

async function generateWallet() {
  let mnemonic = await tonMnemonic.generateMnemonic()
  keyPair = await tonMnemonic.mnemonicToKeyPair(mnemonic)

  wallet = tonweb.wallet.create({ publicKey: keyPair.publicKey })
  let address = await wallet.getAddress()
  let nonBounceableAddress = address.toString(true, true, false)

  $("#address").text(nonBounceableAddress)
  $("#address").attr(
    "href",
    `https://tonscan.org/address/${nonBounceableAddress}`
  )
  let mnemonic_string = mnemonic.join(" ")
  $("#share-mnemonic").text(mnemonic_string)
  $("#share-link").text(
    `${location.protocol}//${location.host}/#${utf8_to_b64(mnemonic_string)}`
  )
  $("#share-link").attr(
    "href",
    `${location.protocol}//${location.host}/#${utf8_to_b64(mnemonic_string)}`
  )

  let balance = await tonweb.getBalance(nonBounceableAddress)
  $("#balance").text(`${TonWeb.utils.fromNano(balance)} Toncoin`)

  $("#share-start").show()
  $("#withdraw-start").show()
  $("#deposit-start").show()
  $("#address-copy").show()
  $("#share-link-button").show()
}

$("#withdraw-amount").on("change", function () {
  $("#withdraw-confirm").hide()
})

async function pre_withdraw() {
  $("#withdraw-confirm").hide()
  const seqno = (await wallet.methods.seqno().call()) || 0
  await sleep(1500)

  let address = await wallet.getAddress()
  let balance = await tonweb.getBalance(address.toString(true, true, false))

  let fees = await wallet.methods
    .transfer({
      secretKey: keyPair.secretKey,
      toAddress: $("#withdraw-address").val(),
      amount: TonWeb.utils.toNano($("#withdraw-amount").val()),
      seqno: seqno,
      payload: $("textarea").val(),
      sendMode: 3,
    })
    .estimateFee()
  if (
    Number(TonWeb.utils.toNano($("#withdraw-amount").val())) + total_fee <=
    Number(balance)
  ) {
    $("#withdraw-fee").text(
      `fee: ${TonWeb.utils.fromNano(total_fee.toString())}`
    )
    $("#withdraw-confirm").show()
  } else {
    $("#withdraw-fee").text(
      `fee: ${TonWeb.utils.fromNano(total_fee.toString())} (no enough funds!)`
    )
  }
}
async function withdraw() {
  $("#withdraw-window").hide()
  $("#status-window").show()

  let seqno = (await wallet.methods.seqno().call()) || 0
  await sleep(1500)
  let address = await wallet.getAddress()
  let balance = await tonweb.getBalance(address.toString(true, true, false))

  await wallet.methods
    .transfer({
      secretKey: keyPair.secretKey,
      toAddress: $("#withdraw-address").val(),
      amount: TonWeb.utils.toNano($("#withdraw-amount").val()),
      seqno: seqno,
      payload: $("textarea").val(),
      sendMode: 3,
    })
    .send()

  let currentSeqno = seqno
  while (currentSeqno == seqno) {
    $("#status").text("waiting for transaction to confirm...")
    await sleep(1500)
    currentSeqno = (await wallet.methods.seqno().call()) || 0
  }
  $("#status").text("success!")
  $("#status-exit").show()
}

$("#withdraw-confirm").on("click", function () {
  withdraw()
})
$("#status-exit").on("click", function () {
  $("#status-window").hide()
  $("#status").text("")
  $(this).hide()
})
$("#withdraw-next").on("click", async function () {
  let address = await wallet.getAddress()
  let balance = await tonweb.getBalance(address.toString(true, true, false))
  if (
    Number(TonWeb.utils.toNano($("#withdraw-amount").val())) <= Number(balance)
  ) {
    pre_withdraw()
  } else {
    alert("no enough funds!")
  }
})
$("#withdraw-start").on("click", function () {
  $("#share-window").hide()
  $("#withdraw-window").show()
})
$("#withdraw-cancel").on("click", function () {
  $("#withdraw-window").hide()
})
$("#deposit-start").on("click", async function () {
  let address = await wallet.getAddress()
  location.href = `ton://transfer/${address.toString(true, true, false)}`
})
$("#share-start").on("click", function () {
  $("#withdraw-window").hide()
  $("#share-window").show()
})
$("#share-close").on("click", function () {
  $("#share-window").hide()
})

$("#address-copy").on("click", function () {
  navigator.clipboard.writeText($("#address").text())
  alert("copied!")
})
$("#share-link-button").on("click", async function () {
  navigator.clipboard.writeText($("#share-link").text())
  alert("copied!")
})

async function importWallet() {
  let mnemonic
  try {
    mnemonic = b64_to_utf8(location.hash.replace("#", "")).split(" ")
  } catch (err) {
    alert("Invalid mnemonic")
    return
  }
  let isValid = await tonMnemonic.validateMnemonic(mnemonic)
  if (!isValid) {
    alert("Invalid mnemonic")
    return
  }
  keyPair = await tonMnemonic.mnemonicToKeyPair(mnemonic)
  wallet = tonweb.wallet.create({ publicKey: keyPair.publicKey })
  let address = await wallet.getAddress()
  let nonBounceableAddress = address.toString(true, true, false)

  $("#address").text(nonBounceableAddress)
  $("#address").attr(
    "href",
    `https://tonscan.org/address/${nonBounceableAddress}`
  )
  let mnemonic_string = mnemonic.join(" ")
  $("#share-mnemonic").text(mnemonic_string)
  $("#share-link").text(
    `${location.protocol}//${location.host}/#${utf8_to_b64(mnemonic_string)}`
  )
  $("#share-link").attr(
    "href",
    `${location.protocol}//${location.host}/#${utf8_to_b64(mnemonic_string)}`
  )

  let balance = await tonweb.getBalance(nonBounceableAddress)
  $("#balance").text(`${TonWeb.utils.fromNano(balance)} Toncoin`)

  $("#share-start").show()
  $("#withdraw-start").show()
  $("#deposit-start").show()
  $("#address-copy").show()
  $("#share-link-button").show()
}

if (location.hash == "") {
  generateWallet()
} else {
  importWallet()
}

setInterval(async () => {
  let address = await wallet.getAddress()
  let balance = await tonweb.getBalance(address.toString(true, true, false))
  $("#balance").text(TonWeb.utils.fromNano(balance) + " Toncoin")
}, 5000)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
