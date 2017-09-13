function capitalizeFirstLetter (str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

exports.formatContact = (contact) => {
  return Object.keys(contact).reduce((obj, key) => {
    if(Array.isArray(contact[key])) {
      obj[capitalizeFirstLetter(key)] = contact[key].join(', ');
    }
    else if(typeof contact[key] === 'object') {
      obj[capitalizeFirstLetter(key)] = this.formatContact(contact[key]);
    }
    else {
      obj[capitalizeFirstLetter(key)] = contact[key];
    }

    return obj;
  }, {});
};
