function setupPg() {
  const pg = require('pg')

  // Type Id 20 = BIGINT | BIGSERIAL
  // This is the type returned from Count(*) for instance
  pg.types.setTypeParser(20, BigInt)

  // 1016 = Type Id for arrays of BigInt values
  const parseBigIntArray = pg.types.getTypeParser(1016)
  pg.types.setTypeParser(1016, a => parseBigIntArray(a).map(BigInt))
}

module.exports = { setupPg }
