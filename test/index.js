require('dotenv').config({ silent: true });

[
  'welcome'
]
.forEach((file) => {
  require('./' + file);
});
