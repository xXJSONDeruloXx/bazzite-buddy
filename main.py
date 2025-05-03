class Plugin:
    # noinspection PyMethodMayBeStatic
    async def get_bazzite_branch(self) -> str | None:
        try:
            file = open("/etc/bazzite/image_branch")
            branch = file.read()
            return branch
        finally:
            return "stable"
