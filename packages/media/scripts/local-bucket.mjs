#!/usr/bin/env node
/**
 * Prepara um bucket local para o envio de fotos: cria, se não existir, e
 * libera a leitura pública.
 *
 * É para MinIO, na máquina de quem desenvolve e no CI. No R2 de produção o
 * bucket é criado no painel da Cloudflare e a leitura pública vem do domínio
 * ligado a ele — lá este script não tem o que fazer, e a política de bucket
 * nem é aceita.
 *
 * Uso, com as variáveis `R2_*` apontando para o MinIO:
 *   pnpm run images:local-bucket
 */

import {
	CreateBucketCommand,
	HeadBucketCommand,
	PutBucketPolicyCommand,
	S3Client,
} from "@aws-sdk/client-s3";

const {
	R2_ENDPOINT: endpoint,
	R2_BUCKET: bucket,
	R2_ACCESS_KEY_ID: accessKeyId,
	R2_SECRET_ACCESS_KEY: secretAccessKey,
} = process.env;

if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
	console.error(
		"Defina R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID e R2_SECRET_ACCESS_KEY.",
	);
	process.exit(1);
}

if (endpoint.includes("r2.cloudflarestorage.com")) {
	console.error(
		"Este script é só para bucket local. No R2, crie o bucket no painel da Cloudflare.",
	);
	process.exit(1);
}

const cliente = new S3Client({
	endpoint,
	region: "auto",
	credentials: { accessKeyId, secretAccessKey },
	forcePathStyle: true,
});

const existe = await cliente
	.send(new HeadBucketCommand({ Bucket: bucket }))
	.then(() => true)
	.catch(() => false);

if (!existe) {
	await cliente.send(new CreateBucketCommand({ Bucket: bucket }));
}

// Leitura anônima de qualquer objeto: é o papel que o CDN faz em produção.
await cliente.send(
	new PutBucketPolicyCommand({
		Bucket: bucket,
		Policy: JSON.stringify({
			Version: "2012-10-17",
			Statement: [
				{
					Effect: "Allow",
					Principal: { AWS: ["*"] },
					Action: ["s3:GetObject"],
					Resource: [`arn:aws:s3:::${bucket}/*`],
				},
			],
		}),
	}),
);

console.log(
	`bucket "${bucket}" ${existe ? "já existia" : "criado"}, com leitura pública`,
);
