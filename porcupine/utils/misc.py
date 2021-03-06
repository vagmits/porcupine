#==============================================================================
#   Copyright (c) 2005-2011, Tassos Koutsovassilis
#
#   This file is part of Porcupine.
#   Porcupine is free software; you can redistribute it and/or modify
#   it under the terms of the GNU Lesser General Public License as published by
#   the Free Software Foundation; either version 2.1 of the License, or
#   (at your option) any later version.
#   Porcupine is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU Lesser General Public License for more details.
#   You should have received a copy of the GNU Lesser General Public License
#   along with Porcupine; if not, write to the Free Software
#   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
#==============================================================================
"""
Porcupine miscelaneous utilities
"""
import io
import hashlib
import time
import random
import os
import sys
import imp
import types

from porcupine.core.compat import str

_VALID_ID_CHRS = [chr(x) for x in
                  list(range(ord('a'), ord('z'))) +
                  list(range(ord('A'), ord('Z'))) +
                  list(range(ord('0'), ord('9')))]


def main_is_frozen():
    return (hasattr(sys, "frozen")          # new py2exe
            or hasattr(sys, "importers")    # old py2exe
            or imp.is_frozen("__main__"))   # tools/freeze


def freeze_support():
    if main_is_frozen():
        sys.path.insert(0, '')
        try:
            import multiprocessing
            multiprocessing.freeze_support()
        except ImportError:
            pass


def generate_file_etag(path):
    file_info = os.stat(path)
    return hex(file_info[6] + file_info[8])


def hash(*args, **kwargs):
    bt = io.BytesIO()
    for arg in args:
        if isinstance(arg, str):
            arg = arg.encode('utf-8')
        bt.write(arg)
    hash = getattr(hashlib, kwargs.get('algo', 'md5'))(bt.getvalue())
    bt.close()
    return hash


def generate_guid():
    """
    Generates a GUID string.

    The GUID length is 32 characters. It is used by the
    session manager to generate session IDs.

    @rtype: str
    """
    return hashlib.md5(str(time.time() + time.clock() * 1000)).hexdigest()


def generate_oid():
    """
    Generates an Object ID string.

    The generated ID is 8 characters long.

    @rtype: str
    """
    return ''.join(random.sample(_VALID_ID_CHRS, 8))


def get_rto_by_name(name):
    """
    This function returns a runtime object by name.

    For example::

        get_rto_by_name('org.innoscript.desktop.schema.common.Folder')()

    instantiates a new I{Folder} object.

    @rtype: type
    """
    modules = name.split('.')
    if len(modules) == 1:
        __module__ = modules[0]
        __attribute__ = []
    else:
        __module__ = '.'.join(modules[:-1])
        __attribute__ = modules[-1]

    mod = __import__(__module__, globals(), locals(), [__attribute__])
    if __attribute__:
        attribute = getattr(mod, __attribute__)
        return attribute
    else:
        return mod


def get_address_from_string(address):
    """
    Accepts a string of the form
    C{address:port} and returns an C{(address, port)} tuple.

    @param address: string of the form C{address:port}
    @type address: str

    @rtype: tuple
    """
    address = address.split(':')
    address[1] = int(address[1])
    return tuple(address)


def reload_module_tree(module, memo=None):
    """
    Reloads a module hierarchy.

    @param module: the top-level module
    @type module: module
    """
    if memo is None:
        memo = {}
        memo['__root__'] = module.__name__

    if module.__name__ not in memo:
        # reload module imports
        module = sys.modules[module.__name__]

        [reload_module_tree(m, memo)
         for m in module.__dict__.values()
         if isinstance(m, types.ModuleType) and
         m.__name__.startswith(memo['__root__'])]

        # reload module
        imp.reload(module)
        #print(module.__name__)
        memo[module.__name__] = True


def reload_module(module):
    dependent = [module]
    if module.__file__[-1] not in ('c', 'o'):
        # remove compiled files
        [os.remove(module.__file__ + x)
         for x in ('c', 'o')
         if os.path.isfile(module.__file__ + x)]
    # find dependencies
    for mod in (m for m in sys.modules.values() if m is not None):
        for x in mod.__dict__.values():
            if x == mod or getattr(x, '__module__', None) == module.__name__:
                if mod not in dependent:
                    dependent.append(mod)
    # reload dependent modules
    [imp.reload(mod) for mod in dependent]


def get_full_path(item):
    """
    Returns the full path of an object

    @param item: a Porcupine Object
    @type item: L{GenericItem<porcupine.systemObjects.GenericItem>}

    @rtype: str
    """
    parents = item.get_all_parents()
    sPath = '/'
    for parent in parents:
        sPath += parent.displayName.value + '/'
    return sPath


def get_revision(pubdir, path):
    """
    Returns the most recent modification
    time of the files listed in a JSMerge post-processing
    filter of a certain registration.

    @param str pubdir: The name of the public directory
    @param str path: The registration's path

    @rtype int
    """
    from porcupine.config import pubdirs
    from porcupine.filters.output import JSMerge

    registration = (pubdirs.dirs[pubdir].get_registration(path))
    s_files = registration.get_filter_by_type(JSMerge)[1]['files']
    if ',' in s_files:
        files = ([f.strip() for f in s_files.split(',')])
    else:
        files = get_rto_by_name(s_files)()

    return JSMerge.get_revision(files)
