# Componentes de terceiros

Gama Remote integra **MeshCentral**, de Ylian Saint-Hilaire e colaboradores, sob licença Apache-2.0. O código e a licença do motor são distribuídos no pacote npm `meshcentral` e em https://github.com/Ylianst/MeshCentral.

O agente Windows é o **MeshAgent**, projeto separado em https://github.com/Ylianst/MeshAgent, distribuído pelo pacote upstream e preparado pelo servidor. Preserve os avisos e as licenças incluídas nos componentes; a marca Gama Remote não muda sua autoria.

`acme-client` e demais dependências mantêm suas licenças originais, disponíveis nos respectivos pacotes. O lockfile registra versões e integridade. Não são redistribuídos binários Windows nem certificados privados neste repositório.

Adaptações locais aplicadas durante a instalação são descritas em `scripts/patch-engine.js` e `docs/seguranca.md`. A aplicação dos patches não remove os avisos de copyright dos arquivos upstream.
