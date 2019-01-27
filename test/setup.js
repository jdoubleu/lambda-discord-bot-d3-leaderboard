const chai = require('chai')
const SinonChai = require('sinon-chai')

chai.use(SinonChai)

global.expect = chai.expect
