var mkdirp = require('mkdirp');

Blockchain = function(blockchainConfig) {
  this.config = blockchainConfig;
}

Blockchain.prototype.generate_basic_command = function() {
  var config = this.config;
  var address = config.account.address;

  var cmd = "geth ";
  var rpc_api = ['eth', 'web3', 'admin', 'net', 'miner'];

  if (config.datadir !== "default") {
    cmd += "--datadir=\"" + config.datadir + "\" ";
    cmd += "--logfile=\"" + config.datadir + ".log\" ";
  }

  if (config.geth_extra_opts) {
    cmd += config.geth_extra_opts + " ";
  }

  
  cmd += "--port " + config.port + " ";
  cmd += "--rpc ";
  cmd += "--rpcport " + config.rpcPort + " ";
  cmd += "--rpcaddr " + config.rpcHost + " ";
  cmd += "--networkid " + config.networkId + " ";
  cmd += "--rpccorsdomain \"" + config.rpcWhitelist + "\" ";
  
  if(config.mine)
    cmd += "--mine ";
  
  if (config.minerthreads !== void 0) 
    cmd += "--minerthreads \"" + config.minerthreads + "\" ";
  
  if (config.genesisBlock !== void 0) 
    cmd += "--genesis=\"" + config.genesisBlock + "\" ";
  

  if (config.whisper) {
    cmd += "--shh ";
    rpc_api.push('shh')
  }

  cmd += '--rpcapi "' + rpc_api.join(',') + '" ';

  cmd += "--maxpeers " + config.maxPeers + " ";

  if (config.account.password !== void 0) {
    cmd += "--password " + config.account.password + " ";
  }

  return cmd;
}

Blockchain.prototype.list_command = function() {
  return this.generate_basic_command() + "account list ";
}

Blockchain.prototype.init_command = function() {
  return this.generate_basic_command() + "account new ";
}

Blockchain.prototype.geth_command = function(geth_args) {
  return this.generate_basic_command() + geth_args;
}

Blockchain.prototype.run_command = function(address, use_tmp) {
  var cmd = this.generate_basic_command();
  var config = this.config;

  if (address !== void 0) {
    cmd += "--unlock " + address + " ";
  }
  
  if (config.nat !== "any"){
    cmd += "--nat \"" + config.nat + "\"";
  }

  if (config.bootNodes.boot == true){
    cmd += "--bootnodes \"";
    for (var i = 0; i < config.bootNodes.enodes.length; i++){
      cmd += config.bootNodes.enodes[i];
      if (i != config.bootNodes.enodes.lenth - 1) cmd += " ";
    }
    cmd += "\"";
  }

  if (config.mine_when_needed) {
    if (use_tmp) {
      cmd += "js /tmp/js/mine.js";
    }
    else {
      cmd += "js node_modules/embark-framework/js/mine.js";
    }
  }

  return cmd;
}

Blockchain.prototype.get_address = function() {
  var config = this.config;

  if(config.account.address)
    return config.account.address;

  var address = null;

  if (config.account.init) {
    // ensure datadir exists, bypassing the interactive liabilities prompt.
    var newDir = mkdirp.sync(config.datadir);
    if (newDir) {
      console.log("=== datadir created");
    } else {
      console.log("=== datadir already exists");
    }

    console.log("running: " + this.list_command());
    result = exec(this.list_command());

    if (result.output.indexOf("Fatal") < 0) {
      console.log("=== already initialized");
      address = result.output.match(/{(\w+)}/)[1];
    } else {
      console.log("running: " + this.init_command());
      result = exec(this.init_command());
      address = result.output.match(/{(\w+)}/)[1];
    }
  }

  return address;
}

Blockchain.prototype.startChain = function(use_tmp) {
  var address = this.get_address();
  console.log("running: " + this.run_command(address, use_tmp));
  exec(this.run_command(address, use_tmp));
}

Blockchain.prototype.execGeth = function(args) {
  var cmd = this.geth_command(args);
  console.log("executing: " + cmd);
  exec(cmd);
}

Blockchain.prototype.getStartChainCommand = function(use_tmp) {
  var address = this.get_address();
  return this.run_command(address, use_tmp);
}

module.exports = Blockchain
