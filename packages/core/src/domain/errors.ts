/**
 * Erros de domínio.
 *
 * Não carregam código HTTP nem mensagem de interface: quem traduz para
 * resposta é o adaptador. Assim o mesmo caso de uso serve a uma rota tRPC, a um
 * comando de linha ou a um teste, sem arrastar nada da borda para dentro.
 */

export class DomainError extends Error {
	constructor(message: string) {
		super(message);
		this.name = new.target.name;
	}
}

/** A entrada viola uma regra da própria entidade. */
export class InvalidInputError extends DomainError {}

/** A entidade referenciada não existe. */
export class NotFoundError extends DomainError {
	constructor(
		readonly entity: string,
		readonly identifier: string,
	) {
		super(`${entity} não encontrado: ${identifier}`);
	}
}

/** Já existe outra entidade ocupando um identificador único. */
export class ConflictError extends DomainError {}
