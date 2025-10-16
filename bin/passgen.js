#!/usr/bin/env node

const { Command } = require('commander');
const clipboardy = require('clipboardy').default;
const crypto = require('crypto');

const program = new Command();

// Character sets for password generation
const CHAR_SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  ambiguous: 'il1Lo0O'
};

/**
 * Generate a secure random password
 * @param {Object} options - Password generation options
 * @returns {string} Generated password
 */
function generatePassword(options = {}) {
  const {
    length = 16,
    includeLowercase = true,
    includeUppercase = true,
    includeNumbers = true,
    includeSymbols = false,
    excludeAmbiguous = false
  } = options;

  let charset = '';
  
  if (includeLowercase) charset += CHAR_SETS.lowercase;
  if (includeUppercase) charset += CHAR_SETS.uppercase;
  if (includeNumbers) charset += CHAR_SETS.numbers;
  if (includeSymbols) charset += CHAR_SETS.symbols;
  
  if (excludeAmbiguous) {
    for (const char of CHAR_SETS.ambiguous) {
      charset = charset.replace(new RegExp(char, 'g'), '');
    }
  }

  if (charset.length === 0) {
    throw new Error('No character sets selected for password generation');
  }

  let password = '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}

/**
 * Copy text to clipboard and show success message
 * @param {string} text - Text to copy
 */
async function copyToClipboard(text) {
  try {
    await clipboardy.write(text);
    console.log('✅ Password copied to clipboard!');
  } catch (error) {
    console.error('❌ Failed to copy to clipboard:', error.message);
    console.log('Generated password:', text);
  }
}

// Configure CLI program
program
  .name('passgen')
  .description('Generate secure random passwords and copy them to clipboard')
  .version('1.0.0');

// Default command (no subcommand)
program
  .option('-l, --length <number>', 'password length', '16')
  .option('--no-lowercase', 'exclude lowercase letters')
  .option('--no-uppercase', 'exclude uppercase letters')
  .option('--no-numbers', 'exclude numbers')
  .option('-s, --symbols', 'include symbols')
  .option('-x, --exclude-ambiguous', 'exclude ambiguous characters (il1Lo0O)')
  .option('--no-copy', 'do not copy to clipboard, just display')
  .action(async (options) => {
    try {
      const length = parseInt(options.length);
      
      if (isNaN(length) || length < 1) {
        console.error('❌ Length must be a positive number');
        process.exit(1);
      }

      if (length > 256) {
        console.error('❌ Length cannot exceed 256 characters');
        process.exit(1);
      }

      const password = generatePassword({
        length,
        includeLowercase: options.lowercase,
        includeUppercase: options.uppercase,
        includeNumbers: options.numbers,
        includeSymbols: options.symbols,
        excludeAmbiguous: options.excludeAmbiguous
      });

      if (options.copy) {
        await copyToClipboard(password);
      } else {
        console.log('Generated password:', password);
      }

    } catch (error) {
      console.error('❌ Error generating password:', error.message);
      process.exit(1);
    }
  });

// Preset commands for common use cases
program
  .command('simple')
  .description('Generate a simple password (letters and numbers only)')
  .option('-l, --length <number>', 'password length', '12')
  .action(async (options) => {
    try {
      const length = parseInt(options.length);
      const password = generatePassword({
        length,
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: false,
        excludeAmbiguous: true
      });
      await copyToClipboard(password);
    } catch (error) {
      console.error('❌ Error generating password:', error.message);
      process.exit(1);
    }
  });

program
  .command('strong')
  .description('Generate a strong password with all character types')
  .option('-l, --length <number>', 'password length', '20')
  .action(async (options) => {
    try {
      const length = parseInt(options.length);
      const password = generatePassword({
        length,
        includeLowercase: true,
        includeUppercase: true,
        includeNumbers: true,
        includeSymbols: true,
        excludeAmbiguous: false
      });
      await copyToClipboard(password);
    } catch (error) {
      console.error('❌ Error generating password:', error.message);
      process.exit(1);
    }
  });

program
  .command('pin')
  .description('Generate a numeric PIN')
  .option('-l, --length <number>', 'PIN length', '6')
  .action(async (options) => {
    try {
      const length = parseInt(options.length);
      const password = generatePassword({
        length,
        includeLowercase: false,
        includeUppercase: false,
        includeNumbers: true,
        includeSymbols: false,
        excludeAmbiguous: false
      });
      await copyToClipboard(password);
    } catch (error) {
      console.error('❌ Error generating PIN:', error.message);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();