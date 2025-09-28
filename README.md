# Melon : A platform to help seggregate IRL content from AI Generated content using cryptographic embedded proofs and trusted hardware sources

### Setup and Running 
> Note: We currently support Raspberry Pi5 machine based hardware
1. Run this cmd on the hardware
```
./script/capture_and_embed.sh
```
This gives you a `Hardware-uuid` which is hardware specific UUID.

Our scripts generate a ed25519 compatible pubKey and privKey for hardware and prevents from malicious usage by staking tokens.

We have a payload with signature using the hardware based privKey and encoded pubKey inside the hash and embed it into EXIF format for images before saving it into JPG/png format

We then verify the signature against the pubkey using ed25519 scheme
We also use pkcs7 format with a forked version of zkPDF to further verify the payload itself and the hardware based certificate using RSA + SHA256 and asn1 format

2. Copy the hardware-uuid and paste it on our platform and stake 0.01 tokens to whitelist the harddware as a trusted source of truth

3. On your local machine fetch the captured file using
```sh
./scripts/fetch.sh
```

4. Upload the image on our portal to verify hardware details and ownership

5. Playaround with our AI Playground to generate images with Embedded proofs for our ai agents that generates images with an ai proof 