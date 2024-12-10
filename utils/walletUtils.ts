import monero from 'monero-ts';

const defaultConfig = new monero.MoneroDaemonConfig({
    server: 'https://node.monerodevs.org:28083',
});

const daemon = monero.connectToDaemonRpc(defaultConfig);

