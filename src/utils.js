function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatContact(contact) {
  return Object.keys(contact).reduce((obj, key) => {
    if(Array.isArray(contact[key])) {
      if(contact[key].length > 0) {
        if(typeof contact[key][0] === 'object') {
          obj[capitalizeFirstLetter(key)] = contact[key].map(formatContact);
        } else {
          obj[capitalizeFirstLetter(key)] = contact[key].join(', ');
        }
      }
    }
    else if(typeof contact[key] === 'object') {
      obj[capitalizeFirstLetter(key)] = formatContact(contact[key]);
    }
    else {
      obj[capitalizeFirstLetter(key)] = contact[key];
    }

    return obj;
  }, {});
};

module.exports = {formatContact};
