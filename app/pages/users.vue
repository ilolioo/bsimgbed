<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-8">用户管理</h1>

    <div class="card p-6">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">创建新用户、编辑角色与状态。用户名至少 4 位，仅支持英文、数字、下划线；新用户角色为普通用户。</p>
      <div class="mb-4">
        <button type="button" class="btn-primary inline-flex items-center gap-2" @click="showCreateUserModal = true">
          <Icon name="heroicons:user-plus" class="w-4 h-4" />
          创建用户
        </button>
      </div>
      <div v-if="userList.length" class="overflow-x-auto">
        <table class="w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-600">
              <th class="py-2 pr-4">用户名</th>
              <th class="py-2 pr-4">邮箱</th>
              <th class="py-2 pr-4">角色</th>
              <th class="py-2 pr-4">状态</th>
              <th class="py-2">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in userList"
              :key="u.id"
              class="border-b border-gray-100 dark:border-gray-700"
            >
              <td class="py-2 pr-4 font-medium">{{ u.username }}</td>
              <td class="py-2 pr-4 text-gray-600 dark:text-gray-400">{{ u.email || '—' }}</td>
              <td class="py-2 pr-4">{{ u.role === 'admin' ? '管理员' : '普通用户' }}</td>
              <td class="py-2 pr-4">
                <span v-if="u.disabled" class="text-amber-600 dark:text-amber-400">已禁用</span>
                <span v-else class="text-green-600 dark:text-green-400">正常</span>
              </td>
              <td class="py-2">
                <button
                  type="button"
                  class="text-primary-600 dark:text-primary-400 hover:underline mr-3"
                  @click="openEditUser(u)"
                >
                  编辑
                </button>
                <button
                  v-if="u.id !== authStore.user?.id && u.username !== authStore.user?.username"
                  type="button"
                  class="text-amber-600 dark:text-amber-400 hover:underline"
                  @click="toggleUserDisabled(u)"
                >
                  {{ u.disabled ? '启用' : '禁用' }}
                </button>
                <button
                  v-if="u.id !== authStore.user?.id && u.username !== authStore.user?.username"
                  type="button"
                  class="text-red-600 dark:text-red-400 hover:underline ml-2"
                  @click="deleteUser(u)"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 创建用户弹窗 -->
      <div
        v-if="showCreateUserModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="closeCreateUserModal"
      >
        <div class="card p-6 w-full max-w-md">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">创建用户</h3>
          <form @submit.prevent="createUser" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">用户名</label>
              <input
                v-model="newUserForm.username"
                type="text"
                class="input w-full"
                placeholder="请输入用户名"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">至少4位，不能为纯数字，仅英文/数字/下划线</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">密码</label>
              <input
                v-model="newUserForm.password"
                type="password"
                class="input w-full"
                placeholder="请输入密码"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱（选填）</label>
              <input
                v-model="newUserForm.email"
                type="email"
                class="input w-full"
                placeholder="选填，可用于登录"
              />
            </div>
            <div class="flex gap-2 pt-2">
              <button type="submit" class="btn-primary" :disabled="creatingUser">
                {{ creatingUser ? '创建中...' : '创建' }}
              </button>
              <button type="button" class="btn-secondary" @click="closeCreateUserModal">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
      <!-- 编辑用户弹层 -->
      <div
        v-if="editingUser"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        @click.self="editingUser = null"
      >
        <div class="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">编辑用户</h3>
          <form @submit.prevent="saveEditUser" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">用户名</label>
              <input
                v-model="editForm.username"
                type="text"
                class="input w-full"
                placeholder="请输入用户名（至少4位）"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">仅支持英文、数字、下划线</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱（选填，可用于登录）</label>
              <input
                v-model="editForm.email"
                type="email"
                class="input w-full"
                placeholder="留空表示不设置邮箱"
              />
            </div>
            <div v-if="editingUser.id !== authStore.user?.id && editingUser.username !== authStore.user?.username">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">角色</label>
              <select v-model="editForm.role" class="input w-full">
                <option value="user">普通用户</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div v-if="editingUser.id !== authStore.user?.id && editingUser.username !== authStore.user?.username" class="flex items-center gap-2">
              <input
                id="edit-disabled"
                v-model="editForm.disabled"
                type="checkbox"
                class="rounded border-gray-300 dark:border-gray-600 text-primary-600"
              />
              <label for="edit-disabled" class="text-sm text-gray-700 dark:text-gray-300">禁用账号</label>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">新密码（不填则不修改）</label>
              <input
                v-model="editForm.newPassword"
                type="password"
                class="input w-full"
                placeholder="留空保持原密码"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">可上传文件大小（MB）</label>
              <input
                v-model.number="editForm.maxFileSizeMB"
                type="number"
                min="0"
                step="1"
                class="input w-full"
                placeholder="留空使用私有 API 默认"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">仅对该用户生效；留空则使用「上传设置」中私有配置的最大文件大小</p>
            </div>

            <!-- 该用户的 API Key（仅管理员可见） -->
            <div v-if="authStore.isAdmin" class="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">该用户的 API Key</label>
                <button
                  type="button"
                  class="btn-secondary text-sm"
                  :disabled="addingUserKey || (editUserApiKeys.length >= 2 && editingUser?.role === 'user')"
                  @click="addEditUserApiKey"
                >
                  {{ addingUserKey ? '添加中...' : '添加' }}
                </button>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">普通用户最多可拥有两个 ApiKey</p>
              <div v-if="loadingEditUserApiKeys" class="text-sm text-gray-500 py-2">加载中...</div>
              <div v-else-if="editUserApiKeys.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-2">暂无 ApiKey</div>
              <div v-else class="space-y-2">
                <div
                  v-for="k in editUserApiKeys"
                  :key="k.id"
                  class="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded text-sm"
                >
                  <div class="min-w-0 flex-1">
                    <span class="font-medium text-gray-900 dark:text-white">{{ k.name }}</span>
                    <span v-if="k.isDefault" class="ml-1 text-xs text-primary-600 dark:text-primary-400">默认</span>
                    <div class="flex items-center gap-1 mt-0.5">
                      <code class="text-xs font-mono truncate text-gray-600 dark:text-gray-400">{{ showEditKeyId === k.id ? k.key : (k.key ? k.key.slice(0, 4) + '****' + k.key.slice(-4) : '') }}</code>
                      <button type="button" class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click="showEditKeyId = showEditKeyId === k.id ? null : k.id">
                        <Icon :name="showEditKeyId === k.id ? 'heroicons:eye-slash' : 'heroicons:eye'" class="w-3.5 h-3.5" />
                      </button>
                      <button type="button" class="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click="copyEditUserKey(k.key)">
                        <Icon name="heroicons:clipboard-document" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div class="flex items-center gap-1 shrink-0">
                    <button v-if="k.isDefault" type="button" class="btn-secondary text-xs py-1" :disabled="regeneratingEditKeyId === k.id" @click="regenerateEditUserKey(k)">
                      {{ regeneratingEditKeyId === k.id ? '刷新中' : '刷新' }}
                    </button>
                    <template v-if="!k.isDefault">
                      <button type="button" class="btn-secondary text-xs py-1" :disabled="settingDefaultEditKeyId === k.id" @click="setEditUserKeyDefault(k)">
                        {{ settingDefaultEditKeyId === k.id ? '设置中' : '设为默认' }}
                      </button>
                      <button type="button" class="text-red-600 dark:text-red-400 text-xs hover:underline" :disabled="deletingEditKeyId === k.id" @click="deleteEditUserKey(k)">
                        {{ deletingEditKeyId === k.id ? '删除中' : '删除' }}
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex gap-2 pt-2">
              <button type="submit" class="btn-primary" :disabled="savingEditUser">
                {{ savingEditUser ? '保存中...' : '保存' }}
              </button>
              <button type="button" class="btn-secondary" @click="editingUser = null">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToastStore } from '~/stores/toast'
import { copyToClipboard } from '~/utils/clipboard'

definePageMeta({
  middleware: ['auth', 'admin']
})

const authStore = useAuthStore()
const toastStore = useToastStore()

const userList = ref([])
const showCreateUserModal = ref(false)
const newUserForm = reactive({ username: '', password: '', email: '' })
const creatingUser = ref(false)
const editingUser = ref(null)
const editForm = reactive({ username: '', email: '', role: 'user', disabled: false, newPassword: '', maxFileSizeMB: '' })
const savingEditUser = ref(false)
const editUserApiKeys = ref([])
const loadingEditUserApiKeys = ref(false)
const showEditKeyId = ref(null)
const addingUserKey = ref(false)
const regeneratingEditKeyId = ref(null)
const deletingEditKeyId = ref(null)
const settingDefaultEditKeyId = ref(null)

async function fetchUserList() {
  if (!authStore.isAdmin) return
  try {
    const res = await $fetch('/api/admin/users', { headers: authStore.authHeader })
    if (res.success && res.data) userList.value = res.data
  } catch (_) {}
}

function closeCreateUserModal() {
  showCreateUserModal.value = false
  newUserForm.username = ''
  newUserForm.password = ''
  newUserForm.email = ''
}

function openEditUser(u) {
  editingUser.value = u
  editForm.username = u.username
  editForm.email = u.email || ''
  editForm.role = u.role || 'user'
  editForm.disabled = !!u.disabled
  editForm.newPassword = ''
  editForm.maxFileSizeMB = u.maxFileSize != null ? Math.round(u.maxFileSize / 1024 / 1024) : ''
  editUserApiKeys.value = []
  showEditKeyId.value = null
  if (authStore.isAdmin && u?.id) fetchEditUserApiKeys(u.id)
}

async function fetchEditUserApiKeys(userId) {
  loadingEditUserApiKeys.value = true
  try {
    const res = await $fetch(`/api/admin/users/${userId}/apikeys`, { headers: authStore.authHeader })
    if (res?.success && Array.isArray(res.data)) editUserApiKeys.value = res.data
  } catch (_) {
    editUserApiKeys.value = []
  } finally {
    loadingEditUserApiKeys.value = false
  }
}

async function addEditUserApiKey() {
  if (!editingUser.value?.id) return
  addingUserKey.value = true
  try {
    const name = editForm.username || editingUser.value.username || '密钥'
    const res = await $fetch(`/api/admin/users/${editingUser.value.id}/apikeys`, {
      method: 'POST',
      body: { name },
      headers: authStore.authHeader
    })
    if (res?.success && res.data) {
      editUserApiKeys.value.push(res.data)
      toastStore.success('ApiKey 已创建')
    } else {
      toastStore.error(res?.message || '创建失败')
    }
  } catch (e) {
    toastStore.error(e?.data?.message || '创建失败')
  } finally {
    addingUserKey.value = false
  }
}

function copyEditUserKey(key) {
  copyToClipboard(key).then(() => toastStore.success('已复制')).catch(() => toastStore.error('复制失败'))
}

async function regenerateEditUserKey(k) {
  regeneratingEditKeyId.value = k.id
  try {
    const res = await $fetch(`/api/apikeys/${k.id}`, {
      method: 'PUT',
      body: { regenerate: true },
      headers: authStore.authHeader
    })
    if (res?.success && res.data) {
      const idx = editUserApiKeys.value.findIndex(x => x.id === k.id)
      if (idx !== -1) editUserApiKeys.value[idx] = res.data
      toastStore.success('ApiKey 已刷新')
    } else {
      toastStore.error(res?.message || '刷新失败')
    }
  } catch (e) {
    toastStore.error(e?.data?.message || '刷新失败')
  } finally {
    regeneratingEditKeyId.value = null
  }
}

async function setEditUserKeyDefault(k) {
  settingDefaultEditKeyId.value = k.id
  try {
    const res = await $fetch(`/api/apikeys/${k.id}`, {
      method: 'PUT',
      body: { isDefault: true },
      headers: authStore.authHeader
    })
    if (res?.success && res.data) {
      editUserApiKeys.value.forEach(key => {
        key.isDefault = key.id === k.id
      })
      toastStore.success('已设为默认')
    } else {
      toastStore.error(res?.message || '设置失败')
    }
  } catch (e) {
    toastStore.error(e?.data?.message || '设置失败')
  } finally {
    settingDefaultEditKeyId.value = null
  }
}

async function deleteEditUserKey(k) {
  deletingEditKeyId.value = k.id
  try {
    const res = await $fetch(`/api/apikeys/${k.id}`, {
      method: 'DELETE',
      headers: authStore.authHeader
    })
    if (res?.success) {
      if (editingUser.value?.id) await fetchEditUserApiKeys(editingUser.value.id)
      toastStore.success('已删除')
    } else {
      toastStore.error(res?.message || '删除失败')
    }
  } catch (e) {
    toastStore.error(e?.data?.message || '删除失败')
  } finally {
    deletingEditKeyId.value = null
  }
}

async function saveEditUser() {
  if (!editingUser.value) return
  const name = editForm.username.trim()
  if (!name || name.length < 4) {
    toastStore.error('用户名至少 4 位')
    return
  }
  if (/^\d+$/.test(name)) {
    toastStore.error('用户名不能为纯数字')
    return
  }
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    toastStore.error('用户名仅支持英文、数字、下划线')
    return
  }
  if (editForm.newPassword && /^\d+$/.test(editForm.newPassword)) {
    toastStore.error('密码不能为纯数字')
    return
  }
  const emailStr = editForm.email ? String(editForm.email).trim().toLowerCase() : ''
  if (emailStr && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr)) {
    toastStore.error('邮箱格式不正确')
    return
  }
  const rawMaxMB = editForm.maxFileSizeMB
  if (rawMaxMB !== '' && rawMaxMB != null) {
    const num = Number(rawMaxMB)
    if (!Number.isFinite(num) || num < 0) {
      toastStore.error('可上传文件大小须为非负数字（MB）')
      return
    }
  }
  savingEditUser.value = true
  try {
    const body = {
      username: editForm.username.trim(),
      email: emailStr || undefined,
      role: editForm.role,
      disabled: editForm.disabled,
      maxFileSize: (rawMaxMB === '' || rawMaxMB == null) ? null : Math.floor(Number(rawMaxMB) * 1024 * 1024)
    }
    if (editForm.newPassword) body.newPassword = editForm.newPassword
    const res = await $fetch(`/api/admin/users/${editingUser.value.id}`, {
      method: 'PUT',
      body,
      headers: authStore.authHeader
    })
    if (res.success) {
      if (editingUser.value.id === authStore.user?.id && res.data?.token) {
        authStore.updateUsername(editForm.username.trim(), res.data.token)
      }
      toastStore.success('已更新')
      editingUser.value = null
      await fetchUserList()
    } else {
      toastStore.error(res.message || '更新失败')
    }
  } catch (e) {
    toastStore.error(e.data?.message || '更新失败')
  } finally {
    savingEditUser.value = false
  }
}

async function toggleUserDisabled(u) {
  try {
    const res = await $fetch(`/api/admin/users/${u.id}`, {
      method: 'PUT',
      body: { disabled: !u.disabled },
      headers: authStore.authHeader
    })
    if (res.success) {
      toastStore.success(u.disabled ? '已启用' : '已禁用')
      await fetchUserList()
    } else {
      toastStore.error(res.message || '操作失败')
    }
  } catch (e) {
    toastStore.error(e.data?.message || '操作失败')
  }
}

async function deleteUser(u) {
  if (!confirm(`确定要删除用户「${u.username}」吗？其名下的图片与 API Key 将转移给管理员。`)) return
  try {
    const res = await $fetch(`/api/admin/users/${u.id}`, {
      method: 'DELETE',
      headers: authStore.authHeader
    })
    if (res.success) {
      toastStore.success('用户已删除')
      await fetchUserList()
    } else {
      toastStore.error(res.message || '删除失败')
    }
  } catch (e) {
    toastStore.error(e.data?.message || '删除失败')
  }
}

async function createUser() {
  const name = newUserForm.username.trim()
  const pwd = newUserForm.password
  if (!name || name.length < 4) {
    toastStore.error('用户名至少 4 位')
    return
  }
  if (/^\d+$/.test(name)) {
    toastStore.error('用户名不能为纯数字')
    return
  }
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    toastStore.error('用户名仅支持英文、数字、下划线')
    return
  }
  if (!pwd || pwd.length < 6) {
    toastStore.error('密码至少 6 位')
    return
  }
  if (/^\d+$/.test(pwd)) {
    toastStore.error('密码不能为纯数字')
    return
  }
  creatingUser.value = true
  try {
    const body = { username: name, password: pwd }
    if (newUserForm.email?.trim()) body.email = newUserForm.email.trim()
    const res = await $fetch('/api/admin/users', {
      method: 'POST',
      body,
      headers: authStore.authHeader
    })
    if (res.success) {
      toastStore.success('用户已创建')
      closeCreateUserModal()
      await fetchUserList()
    } else {
      toastStore.error(res.message || '创建失败')
    }
  } catch (e) {
    toastStore.error(e.data?.message || '创建用户失败')
  } finally {
    creatingUser.value = false
  }
}

onMounted(() => {
  fetchUserList()
})
</script>
