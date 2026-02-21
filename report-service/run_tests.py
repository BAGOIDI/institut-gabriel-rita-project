#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Script principal pour exécuter tous les tests de l'application
"""

import unittest
import sys
import os

# Ajouter le chemin de l'application pour permettre les imports
sys.path.insert(0, os.path.abspath('.'))

def run_all_tests():
    """Exécuter tous les tests de l'application"""
    print("Démarrage des tests de l'application...")
    print("=" * 50)
    
    # Découverte et exécution des tests
    loader = unittest.TestLoader()
    start_dir = '.'
    suite = loader.discover(start_dir, pattern='test_*.py')
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    print("\n" + "=" * 50)
    print("Résultats des tests:")
    print(f"Exécutés: {result.testsRun}")
    print(f"Erreurs: {len(result.errors)}")
    print(f"Échecs: {len(result.failures)}")
    
    if result.errors:
        print("\nErreurs:")
        for test, error in result.errors:
            print(f"- {test}: {error}")
    
    if result.failures:
        print("\nÉchecs:")
        for test, failure in result.failures:
            print(f"- {test}: {failure}")
    
    print(f"\nSuccès: {result.wasSuccessful()}")
    return result.wasSuccessful()

def run_specific_tests(test_file=None):
    """
    Exécuter des tests spécifiques
    
    Args:
        test_file (str): Nom du fichier de test à exécuter (optionnel)
    """
    if test_file:
        # Charger un fichier de test spécifique
        loader = unittest.TestLoader()
        suite = loader.loadTestsFromName(test_file)
        runner = unittest.TextTestRunner(verbosity=2)
        result = runner.run(suite)
        return result.wasSuccessful()
    else:
        return run_all_tests()

if __name__ == '__main__':
    if len(sys.argv) > 1:
        # Si un argument est fourni, exécuter les tests spécifiques
        test_to_run = sys.argv[1]
        success = run_specific_tests(test_to_run)
    else:
        # Sinon, exécuter tous les tests
        success = run_all_tests()
    
    # Quitter avec le code approprié
    sys.exit(0 if success else 1)