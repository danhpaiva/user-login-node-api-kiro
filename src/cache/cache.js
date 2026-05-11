const NodeCache = require('node-cache');

// TTL padrão: 60 segundos. Pode ser sobrescrito via env CACHE_TTL.
const TTL = parseInt(process.env.CACHE_TTL || '60', 10);

const cache = new NodeCache({ stdTTL: TTL, checkperiod: TTL * 2 });

// Chaves padronizadas para evitar typos
const KEYS = {
  allUsers: 'users:all',
  user: (id) => `users:${id}`,
};

/**
 * Invalida todas as entradas relacionadas a usuários.
 * Chamado após create, update e delete.
 */
function invalidateAll() {
  cache.flushAll();
}

/**
 * Invalida apenas a entrada de um usuário específico e a lista geral.
 * @param {string} id
 */
function invalidateUser(id) {
  cache.del(KEYS.user(id));
  cache.del(KEYS.allUsers);
}

module.exports = { cache, KEYS, invalidateAll, invalidateUser };
