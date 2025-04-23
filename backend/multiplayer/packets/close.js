export default async function close(packet, context) {
  console.log('Received close packet');
  return {
    type: "close",
    success: true,
  };
}