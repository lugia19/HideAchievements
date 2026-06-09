local json = require("json")
local logger = require("logger")
local millennium = require("millennium")

local DEFAULTS = {
    activity = "hover",
    achievements = "hover",
    cards = "hover",
    mini_achievements = "hide",
    overlay = "hide",
}

local function settings_path()
    return millennium.get_install_path() .. "/settings.json"
end

local function merge_defaults(settings)
    local result = {}
    for k, v in pairs(DEFAULTS) do
        if settings[k] ~= nil then
            result[k] = settings[k]
        else
            result[k] = v
        end
    end
    return result
end

local function load_settings()
    local file = io.open(settings_path(), "r")
    if not file then
        return merge_defaults({})
    end

    local content = file:read("*a")
    file:close()

    local ok, parsed = pcall(json.decode, content)
    if not ok or type(parsed) ~= "table" then
        logger:info("Settings file invalid, using defaults")
        return merge_defaults({})
    end

    return merge_defaults(parsed)
end

local function save_settings(settings)
    local file, err = io.open(settings_path(), "w")
    if not file then
        logger:error("Failed to write settings: " .. (err or "unknown"))
        return false
    end

    file:write(json.encode(settings))
    file:close()
    return true
end

function GetSettings()
    local success, result = pcall(function()
        return json.encode({ success = true, data = load_settings() })
    end)

    if not success then
        logger:error("GetSettings error: " .. tostring(result))
        return json.encode({ success = false, error = tostring(result) })
    end

    return result
end

function SaveSettings(settings_json)
    local success, result = pcall(function()
        local parsed = json.decode(settings_json)
        if type(parsed) ~= "table" then
            return json.encode({ success = false, error = "Invalid settings" })
        end

        if not save_settings(merge_defaults(parsed)) then
            return json.encode({ success = false, error = "Failed to write settings file" })
        end

        return json.encode({ success = true })
    end)

    if not success then
        logger:error("SaveSettings error: " .. tostring(result))
        return json.encode({ success = false, error = tostring(result) })
    end

    return result
end

local function on_load()
    logger:info("HideAchievements plugin loaded, Millennium " .. millennium.version())
    millennium.ready()
end

return {
    on_load = on_load,
    GetSettings = GetSettings,
    SaveSettings = SaveSettings,
}
