#===============================================================================
#    Copyright 2005-2009, Tassos Koutsovassilis
#
#    This file is part of Porcupine.
#    Porcupine is free software; you can redistribute it and/or modify
#    it under the terms of the GNU Lesser General Public License as published by
#    the Free Software Foundation; either version 2.1 of the License, or
#    (at your option) any later version.
#    Porcupine is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU Lesser General Public License for more details.
#    You should have received a copy of the GNU Lesser General Public License
#    along with Porcupine; if not, write to the Free Software
#    Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
#===============================================================================
"Base database cursor class"
from porcupine import context
from porcupine.core import persist
from porcupine.db import _db
from porcupine.utils import permsresolver
from porcupine.utils.db import pack_value
from porcupine.systemObjects import Shortcut

class BaseCursor(object):
    "Base cursor class"

    def __init__(self, index, trans):
        self._index = index
        self._value = None
        self._range = None
        self._reversed = False
        self._trans = trans

        # fetch_mode possible values are
        # 0: return primary key only
        # 1: return objects
        self.fetch_mode = 1
        self.fetch_all = False
        self.resolve_shortcuts = False

    def _get_item(self, s):
        item = persist.loads(s)
        if self.fetch_all:
            if self.resolve_shortcuts:
                while item != None and isinstance(item, Shortcut):
                    item = _db.get_item(item.target.value, self._trans)
        else:
            # check read permissions
            access = permsresolver.get_access(item, context.user)
            if item._isDeleted or access == 0:
                item = None
            elif self.resolve_shortcuts and isinstance(item, Shortcut):
                item = item.get_target(self._trans)
        return item

    def set(self, v):
        val = pack_value(v)
        self._value = val
        self._range = None
    
    def set_range(self, lower_bound, upper_bound):
        self._range = Range(lower_bound, upper_bound)
        self._value = None

    def reverse(self):
        self._reversed = not self._reversed

    def duplicate(self):
        raise NotImplementedError

    def reset(self):
        raise NotImplementedError
    
    def __iter__(self):
        raise NotImplementedError
    
    def close(self):
        raise NotImplementedError

class Range(object):
    """
    Range objects are used for setting cursor boundaries.
    The bounds are tuples of two elements. The first element contains the
    value while the second is a boolean indicating if the value is
    inclusive.
    """

    def __init__(self, lower_bound=None, upper_bound=None):
        self.set_lower_bound(lower_bound)
        self.set_upper_bound(upper_bound)

    def set_lower_bound(self, lower_bound):
        if lower_bound != None:
            value, inclusive = lower_bound
            self._lower_value = pack_value(value)
            self._lower_inclusive = inclusive
        else:
            self._lower_value = None
            self._lower_inclusive = False

    def set_upper_bound(self, upper_bound):
        if upper_bound != None:
            value, inclusive = upper_bound
            self._upper_value = pack_value(value)
            self._upper_inclusive = inclusive
        else:
            self._upper_value = None
            self._upper_inclusive = False

    def __contains__(self, string_value):
        if self._lower_value != None:
            cmp_value = [-1]
            if self._lower_inclusive:
                cmp_value.append(0)
            if not cmp(self._lower_value, string_value) in cmp_value:
                return False
        if self._upper_value != None:
            cmp_value = [1]
            if self._upper_inclusive:
                cmp_value.append(0)
            if not cmp(self._upper_value, string_value) in cmp_value:
                return False
        return True
